const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');
// const jwt = require('jsonwebtoken');

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

const getUserId = async (token, survey_id) => {
    let userId;

    // Если нет user_id из токена, получаем его из базы данных
    if (!userId) {
        const query = 'SELECT user_id FROM surveys WHERE id = ?';
        const result = await queryAsync(query, [survey_id]);

        if (result.length === 0) {
            throw new Error('Survey not found');
        }

        userId = result[0].user_id; // Извлекаем user_id из опроса
    }

    return userId;
};

// Удаление опроса с зависимыми данными
router.delete('/surveys/:survey_id', async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id || isNaN(survey_id)) {
        console.error(`Invalid or missing survey_id: ${survey_id}`);
        return res.status(400).json({ error: 'Invalid or missing survey_id' });
    }

    // Получаем соединение из пула
    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Error getting connection:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        try {
            // Начинаем транзакцию
            await connection.beginTransaction();

            // Проверяем, существует ли опрос
            const checkQuery = `SELECT * FROM surveys WHERE id = ?`;
            const survey = await queryAsync(checkQuery, [survey_id]);

            if (survey.length === 0) {
                console.error(`Survey with ID ${survey_id} not found.`);
                return res.status(404).json({ error: 'Survey not found' });
            }

            // Удаляем все варианты ответов, связанные с вопросами данного опроса
            const deleteOptionsQuery = `DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)`;
            await queryAsync(deleteOptionsQuery, [survey_id]);

            // Удаляем все вопросы, связанные с данным опросом
            const deleteQuestionsQuery = `DELETE FROM questions WHERE survey_id = ?`;
            await queryAsync(deleteQuestionsQuery, [survey_id]);

            // Теперь удаляем сам опрос
            const deleteSurveyQuery = `DELETE FROM surveys WHERE id = ?`;
            await queryAsync(deleteSurveyQuery, [survey_id]);

            // Подтверждаем транзакцию
            await connection.commit();

            console.log(`Survey with ID ${survey_id} successfully deleted`);
            res.status(200).json({ message: 'Survey deleted successfully' });
        } catch (error) {
            // Откатываем транзакцию в случае ошибки
            await connection.rollback();
            console.error('Error deleting survey:', error);
            res.status(500).json({ error: 'Failed to delete survey' });
        } finally {
            // Освобождаем соединение
            connection.release();
        }
    });
});

// Маршрут для получения опросов пользователя по его ID
router.get('/questions/:survey_id', async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id || isNaN(survey_id)) {
        return res.status(400).json({ error: 'Invalid or missing survey_id' });
    }

    try {
        // Запрос для получения данных об опросе и вопросов
        const query = `
            SELECT
                s.title AS survey_name,
                s.created_at AS survey_date,
                q.id AS question_id,
                q.text AS question_text,
                o.id AS option_id,
                o.text AS option_text,
                q.correct_option AS correct_option_id
            FROM
                surveys s
            LEFT JOIN
                questions q ON s.id = q.survey_id
            LEFT JOIN
                options o ON q.id = o.question_id
            WHERE
                s.id = ?;
        `;

        const data = await queryAsync(query, [survey_id]);

        if (data.length === 0) {
            return res.status(404).json({ message: 'No questions found for this survey' });
        }

        // Извлекаем данные об опросе
        const surveyInfo = {
            survey_name: data[0].survey_name,
            survey_date: data[0].survey_date
        };

        // Форматируем вопросы
        const questions = data.reduce((acc, row) => {
            let question = acc.find((q) => q.question_id === row.question_id);

            if (!question) {
                question = {
                    question_id: row.question_id,
                    question_text: row.question_text,
                    correct_option_id: row.correct_option_id,
                    options: []
                };
                acc.push(question);
            }

            if (row.option_id) {
                question.options.push({
                    option_id: row.option_id,
                    option_text: row.option_text
                });
            }

            return acc;
        }, []);

        // Формируем итоговый ответ
        const response = {
            ...surveyInfo,
            questions
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error retrieving questions:', error);
        res.status(500).json({ error: 'Failed to retrieve questions' });
    }
});

// Маршрут для копирования опроса
router.post('/surveys/:survey_id/copy', async (req, res) => {
    const { survey_id } = req.params;
    const token = req.headers['token'];

    // Проверяем входные данные
    if (!survey_id || isNaN(survey_id)) {
        console.error(`Invalid or missing survey_id: ${survey_id}`);
        return res.status(400).json({ error: 'Invalid or missing survey_id' });
    }

    // Получаем соединение из пула
    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Error getting connection:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        try {
            // Начинаем транзакцию
            await connection.beginTransaction();

            // Проверяем, существует ли опрос
            const checkSurveyQuery = `SELECT * FROM surveys WHERE id = ?`;
            const survey = await queryAsync(checkSurveyQuery, [survey_id]);

            if (survey.length === 0) {
                console.error(`Survey with ID ${survey_id} not found.`);
                return res.status(404).json({ error: 'Survey not found' });
            }

            // Копируем данные об опросе
            const newSurvey = {
                title: `${survey[0].title} (Копия)`, // Добавляем "(Копия)" к названию
                created_at: new Date() // Новая дата создания
            };

            // Получаем user_id (например, на основе токена)
            const user_id = await getUserId(token, survey_id);

            // Вставляем новый опрос в таблицу
            const insertSurveyQuery = `INSERT INTO surveys (title, created_at, user_id) VALUES (?, ?, ?)`;
            const result = await queryAsync(insertSurveyQuery, [newSurvey.title, newSurvey.created_at, user_id]);

            // Получаем ID нового опроса
            const newSurveyId = result.insertId;

            // Копируем вопросы
            const copyQuestionsQuery = `SELECT * FROM questions WHERE survey_id = ?`;
            const questions = await queryAsync(copyQuestionsQuery, [survey_id]);

            if (questions.length > 0) {
                const insertQuestionsQuery = `INSERT INTO questions (survey_id, text, correct_option) VALUES ?`;
                const questionValues = questions.map((q) => [newSurveyId, q.text, q.correct_option]);
                await queryAsync(insertQuestionsQuery, [questionValues]);

                // Получаем новые question_id
                const getNewQuestionIdsQuery = `SELECT id FROM questions WHERE survey_id = ? ORDER BY id ASC`;
                const newQuestions = await queryAsync(getNewQuestionIdsQuery, [newSurveyId]);

                if (questions.length !== newQuestions.length) {
                    throw new Error('Mismatch in the number of old and new questions');
                }

                // Создаем объект сопоставления старого и нового question_id
                const questionMapping = {};
                questions.forEach((q, index) => {
                    questionMapping[q.id] = newQuestions[index].id;
                });

                // Копируем варианты ответов
                const copyOptionsQuery = `SELECT * FROM options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)`;
                const options = await queryAsync(copyOptionsQuery, [survey_id]);

                if (options.length > 0) {
                    const optionValues = options.map((o) => {
                        const newQuestionId = questionMapping[o.question_id];
                        if (!newQuestionId) {
                            throw new Error(`No matching new question_id for old question_id ${o.question_id}`);
                        }
                        return [newQuestionId, o.text];
                    });

                    const insertOptionsQuery = `INSERT INTO options (question_id, text) VALUES ?`;
                    await queryAsync(insertOptionsQuery, [optionValues]);
                }
            }

            // Подтверждаем транзакцию
            await connection.commit();

            console.log(`Survey with ID ${survey_id} successfully copied to new survey with ID ${newSurveyId}`);
            res.status(201).json({
                message: 'Survey copied successfully',
                new_survey_id: newSurveyId
            });
        } catch (error) {
            // Откатываем транзакцию в случае ошибки
            await connection.rollback();
            console.error('Error copying survey:', error);
            res.status(500).json({ error: 'Failed to copy survey' });
        } finally {
            // Освобождаем соединение
            connection.release();
        }
    });
});

module.exports = router;
