const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');

// Подключаем .env файл
dotenv.config({ path: '../backend/.env' });

// Создаем подключение к базе данных
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Утилита для выполнения запросов с использованием Promises
const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Маршрут для получения опросов пользователя по его ID
router.get('/questions/:survey_id', async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id || isNaN(survey_id)) {
        return res.status(400).json({ error: 'Invalid or missing survey_id' });
    }

    try {
        // Запрос для получения вопросов и их вариантов
        const query = `
            SELECT
                q.id AS question_id,
                q.text AS question_text,
                o.id AS option_id,
                o.text AS option_text,
                q.correct_option AS correct_option_id
            FROM
                questions q
            LEFT JOIN
                options o ON q.id = o.question_id
            WHERE
                q.survey_id = ?;
        `;

        const data = await queryAsync(query, [survey_id]);

        if (data.length === 0) {
            return res.status(404).json({ message: 'No questions found for this survey' });
        }

        // Форматируем результат: группируем варианты ответа по вопросам
        const result = data.reduce((acc, row) => {
            const question = acc.get(row.question_id);

            if (!question) {
                acc.set(row.question_id, {
                    question_id: row.question_id,
                    question_text: row.question_text,
                    correct_option_id: row.correct_option_id,
                    options: [
                        {
                            option_id: row.option_id,
                            option_text: row.option_text
                        }
                    ]
                });
            } else {
                question.options.push({
                    option_id: row.option_id,
                    option_text: row.option_text
                });
            }

            return acc;
        }, new Map());

        // Преобразуем Map в массив
        const finalResult = Array.from(result.values());

        res.status(200).json(finalResult);
    } catch (error) {
        console.error('Error retrieving questions:', error);
        res.status(500).json({ error: 'Failed to retrieve questions' });
    }
});

module.exports = router;
