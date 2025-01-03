const express = require('express');
const router = express.Router();
// const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mysql = require('mysql'); // Импортируем библиотеку для работы с MySQL

dotenv.config({ path: '../backend/.env' });

// Настраиваем соединение с базой данных MySQL
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST, // Хост базы данных из переменных окружения
    user: process.env.DATABASE_USER, // Пользователь базы данных
    password: process.env.DATABASE_PASSWORD, // Пароль базы данных
    database: process.env.DATABASE // Имя базы данных
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

// Пример исправленного кода для выполнения запроса без getConnection
router.post('/create', async (req, res) => {
    const { user_id, title, questions } = req.body;
    console.log(user_id);

    if (!user_id || !title || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Параметры запроса некорректны' });
    }

    // Используем сам пул для выполнения запросов
    try {
        // Начинаем транзакцию
        await queryAsync(db, 'START TRANSACTION');

        // 1. Сохраняем опрос
        const surveyResult = await queryAsync(db, 'INSERT INTO surveys (user_id, title) VALUES (?, ?)', [user_id, title]);
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
            const questionResult = await queryAsync(db, 'INSERT INTO questions (survey_id, text, correct_option) VALUES (?, ?, ?)', [surveyId, text, correct_option]);
            const questionId = questionResult.insertId;

            if (!questionId) {
                throw new Error('Ошибка при получении ID вопроса');
            }

            // Сохраняем варианты ответа
            for (const option of options) {
                await queryAsync(db, 'INSERT INTO options (question_id, text) VALUES (?, ?)', [questionId, option]);
            }
        }

        // Фиксируем транзакцию
        await queryAsync(db, 'COMMIT');

        res.status(201).json({ message: 'Опрос успешно сохранен', surveyId });
    } catch (error) {
        // Откат транзакции в случае ошибки
        console.error('Ошибка при сохранении опроса:', error);
        try {
            await queryAsync(db, 'ROLLBACK');
        } catch (rollbackError) {
            console.error('Ошибка при откате транзакции:', rollbackError);
        }
        res.status(500).json({ error: 'Ошибка при сохранении опроса' });
    }
});

module.exports = router;
