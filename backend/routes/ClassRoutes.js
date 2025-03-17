const express = require('express');
const { createClass, getUserClasses, getClassById, updateClass, deleteClass } = require('../controllers/ClassController');

const router = express.Router();

router.post('/classes', createClass); // Создать класс
router.get('/classes/user/:userId', getUserClasses); // Получить классы пользователя
router.get('/classes/:id', getClassById); // Получить один класс
router.put('/classes/:id', updateClass); // Обновить класс
router.delete('/classes/:id', deleteClass); // Удалить класс

module.exports = router;
