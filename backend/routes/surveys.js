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

router.post('/update/:surveyId', async (req, res) => {
    const surveyId = req.params.surveyId; // Получаем ID опроса из параметров маршрута
    const { user_id, title, questions } = req.body;

    console.log(user_id, surveyId);

    // Проверяем параметры запроса
    if (!user_id || !title || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Параметры запроса некорректны' });
    }

    try {
        // Проверка существования опроса
        const existingSurvey = await queryAsync(db, 'SELECT * FROM surveys WHERE id = ? AND user_id = ?', [surveyId, user_id]);
        if (existingSurvey.length === 0) {
            return res.status(404).json({ error: 'Опрос не найден или вы не имеете доступа к этому опросу' });
        }

        // Начинаем транзакцию
        await queryAsync(db, 'START TRANSACTION');

        // 1. Обновляем информацию об опросе
        const updateSurveyResult = await queryAsync(db, 'UPDATE surveys SET title = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', [title, surveyId]);

        if (updateSurveyResult.affectedRows === 0) {
            throw new Error('Не удалось обновить информацию об опросе');
        }

        // 2. Удаляем старые вопросы и варианты ответов
        // Удаляем все вопросы и их варианты, чтобы добавить обновленные
        await queryAsync(db, 'DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)', [surveyId]);
        await queryAsync(db, 'DELETE FROM questions WHERE survey_id = ?', [surveyId]);

        // 3. Добавляем новые вопросы и варианты ответов
        for (const question of questions) {
            const { text, correct_option, options } = question;

            if (!text || !Array.isArray(options) || correct_option === undefined) {
                throw new Error('Некорректные данные вопроса');
            }

            // Сохраняем новый вопрос
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

        res.status(200).json({ message: 'Опрос успешно обновлен' });
    } catch (error) {
        // Откат транзакции в случае ошибки
        console.error('Ошибка при редактировании опроса:', error);
        try {
            await queryAsync(db, 'ROLLBACK');
        } catch (rollbackError) {
            console.error('Ошибка при откате транзакции:', rollbackError);
        }
        res.status(500).json({ error: 'Ошибка при редактировании опроса' });
    }
});

router.get('/:surveyId', async (req, res) => {
    const { surveyId } = req.params;
    console.log(11111111111111);
    if (!surveyId) {
        return res.status(400).json({ error: 'ID опроса не предоставлено' });
    }

    try {
        // Получаем данные о самом опросе (название и дату)
        const surveyQuery = 'SELECT * FROM surveys WHERE id = ?';
        const surveyResult = await queryAsync(db, surveyQuery, [surveyId]);

        if (surveyResult.length === 0) {
            return res.status(404).json({ error: 'Опрос не найден' });
        }

        const survey = surveyResult[0]; // Первый элемент результата

        // Получаем все вопросы для этого опроса
        const questionsQuery = 'SELECT * FROM questions WHERE survey_id = ?';
        const questionsResult = await queryAsync(db, questionsQuery, [surveyId]);

        // Добавляем варианты ответа для каждого вопроса
        const questionsWithOptions = [];
        for (const question of questionsResult) {
            const optionsQuery = 'SELECT * FROM options WHERE question_id = ?';
            const optionsResult = await queryAsync(db, optionsQuery, [question.id]);

            questionsWithOptions.push({
                ...question,
                options: optionsResult.map((option) => option.text)
            });
        }
        console.log(survey.title);
        // Формируем ответ
        const response = {
            id: survey.id,
            title: survey.title,
            questions: questionsWithOptions
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Ошибка при получении данных об опросе:', error);
        res.status(500).json({ error: 'Ошибка при получении данных об опросе' });
    }
});

module.exports = router;
