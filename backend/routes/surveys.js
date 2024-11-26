const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Утилита для выполнения запросов с использованием Promises
const queryAsync = (connection, query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

router.post('/create', async (req, res) => {
    const { user_id, title, questions } = req.body;
    console.log(user_id, title, questions);

    if (!user_id || !title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Некорректные данные (проверьте user_id, title и questions)' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            // Начинаем транзакцию
            await queryAsync(connection, 'START TRANSACTION');

            // 1. Сохраняем опрос
            const surveyResult = await queryAsync(connection, 'INSERT INTO surveys (title, user_id) VALUES (?, ?)', [title, user_id]);
            const surveyId = surveyResult.insertId;

            if (!surveyId) {
                throw new Error('Ошибка при получении ID опроса');
            }

            // 2. Сохраняем вопросы
            for (const question of questions) {
                const { text, correct_option, options } = question;

                if (!text || !Array.isArray(options) || correct_option === undefined) {
                    throw new Error('Некорректные данные вопроса');
                }

                // Сохраняем вопрос
                const questionResult = await queryAsync(connection, 'INSERT INTO questions (survey_id, text, correct_option) VALUES (?, ?, ?)', [surveyId, text, correct_option]);
                const questionId = questionResult.insertId;

                if (!questionId) {
                    throw new Error('Ошибка при получении ID вопроса');
                }

                // Сохраняем варианты ответа
                for (const option of options) {
                    await queryAsync(connection, 'INSERT INTO options (question_id, text) VALUES (?, ?)', [questionId, option]);
                }
            }

            // Фиксируем транзакцию
            await queryAsync(connection, 'COMMIT');
            connection.release();

            res.status(201).json({ message: 'Опрос успешно сохранен', surveyId });
        } catch (error) {
            // Откат транзакции в случае ошибки
            console.error('Ошибка при сохранении опроса:', error);

            try {
                await queryAsync(connection, 'ROLLBACK');
            } catch (rollbackError) {
                console.error('Ошибка при откате транзакции:', rollbackError);
            } finally {
                connection.release();
            }

            res.status(500).json({ error: 'Ошибка при сохранении опроса' });
        }
    });
});

module.exports = router;
