const express = require('express');
const { createSurvey, getSurveysByUser, getSurveyById, updateSurvey, deleteSurvey } = require('../controllers/SurveyController');

const router = express.Router();

// 📌 Маршруты для опросов
router.post('/surveys', createSurvey); // Создание опроса
router.get('/surveys/user/:userId', getSurveysByUser); // Получение всех опросов по userId
router.get('/surveys/:id', getSurveyById); // Получение опроса по ID
router.put('/surveys/:id', updateSurvey); // Обновление опроса
router.delete('/surveys/:id', deleteSurvey); // Удаление опроса

module.exports = router;
