const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config({ path: '../backend/.env' });

// Создание пула соединений
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'eduvision_db' // Название базы данных
});

// Вспомогательная функция для выполнения SQL-запросов
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

router.get('/class/:classId', async (req, res) => {
    const classId = req.params.classId;

    if (!classId) {
        return res.status(400).json({ error: 'Не передан ID класса' });
    }

    try {
        // Получаем данные о классе
        const classQuery = `SELECT * FROM class WHERE id = ?`;
        const classResult = await queryAsync(db, classQuery, [classId]);

        if (classResult.length === 0) {
            return res.status(404).json({ error: 'Класс не найден' });
        }

        // Получаем студентов, которые принадлежат данному классу
        const studentsQuery = `
            SELECT student.aruco_num, student.name
            FROM student
            JOIN class ON class.id = student.class_id
            WHERE class.id = ?`;

        const studentsResult = await queryAsync(db, studentsQuery, [classId]);

        // Формируем ответ с данными о классе и связанных студентах
        const response = {
            class: classResult[0], // Информация о классе
            students: studentsResult // Студенты, относящиеся к этому классу
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Ошибка при запросе о классе:', err);
        res.status(500).json({ error: 'Ошибка при получении данных о классе' });
    }
});

// Получение данных об опросе
router.get('/survey1/:surveyId', async (req, res) => {
    const { surveyId } = req.params;

    if (!surveyId) {
        return res.status(400).json({ error: 'ID опроса не предоставлено' });
    }

    try {
        // 1. Получаем данные об опросе
        const surveyQuery = 'SELECT * FROM surveys WHERE id = ?';
        const surveyResult = await queryAsync(db, surveyQuery, [surveyId]);

        if (surveyResult.length === 0) {
            return res.status(404).json({ error: 'Опрос не найден' });
        }

        const survey = surveyResult[0]; // Первый элемент результата

        // 2. Получаем все вопросы для этого опроса
        const questionsQuery = 'SELECT * FROM questions WHERE survey_id = ?';
        const questionsResult = await queryAsync(db, questionsQuery, [surveyId]);

        // 3. Добавляем варианты ответов для каждого вопроса и преобразуем их в нужный формат
        const questionsWithOptions = questionsResult.map((question) => {
            const optionsQuery = 'SELECT * FROM options WHERE question_id = ?';
            return queryAsync(db, optionsQuery, [question.id]).then((optionsResult) => {
                // Преобразуем текст вариантов в массив
                const options = optionsResult.map((option) => option.text);
                return {
                    text: question.text, // текст вопроса
                    options: options // массив вариантов
                };
            });
        });

        // Ждем, пока все вопросы с вариантами будут готовы
        const formattedQuestions = await Promise.all(questionsWithOptions);

        // Формируем ответ
        const response = {
            id: survey.id,
            title: survey.title,
            questions: formattedQuestions // передаем отформатированные вопросы с вариантами
        };

        // Отправляем ответ
        res.status(200).json(response);
    } catch (error) {
        console.error('Ошибка при получении данных об опросе:', error);
        res.status(500).json({ error: 'Ошибка при получении данных об опросе' });
    }
});
module.exports = router;
