const express = require('express');
const { createQuestion, getQuestionsBySurvey, getQuestionById, updateQuestion, deleteQuestion } = require('../controllers/QuestionController');

const router = express.Router();

// 📌 Маршруты для вопросов
router.post('/questions', createQuestion); // Создание вопроса
router.get('/questions/survey/:surveyId', getQuestionsBySurvey); // Получение вопросов для опроса
router.get('/questions/:id', getQuestionById); // Получение вопроса по ID
router.put('/questions/:id', updateQuestion); // Обновление вопроса
router.delete('/questions/:id', deleteQuestion); // Удаление вопроса

module.exports = router;
