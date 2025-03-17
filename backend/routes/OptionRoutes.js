const express = require('express');
const { createOption, getOptionsByQuestion, getOptionById, updateOption, deleteOption } = require('../controllers/OptionController');

const router = express.Router();

// 📌 Маршруты для вариантов ответа
router.post('/options', createOption); // Создание варианта ответа
router.get('/options/question/:questionId', getOptionsByQuestion); // Получение вариантов ответа для вопроса
router.get('/options/:id', getOptionById); // Получение варианта ответа по ID
router.put('/options/:id', updateOption); // Обновление варианта ответа
router.delete('/options/:id', deleteOption); // Удаление варианта ответа

module.exports = router;
