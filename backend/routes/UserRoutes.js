// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// Роуты для пользователей
router.post('/users', UserController.createUserHandler); // Создание пользователя
router.get('/users/:id', UserController.getUser); // Получение пользователя по ID
router.put('/users/:id', UserController.updateUser); // Обновление данных пользователя
router.delete('/users/:id', UserController.deleteUser); // Удаление пользователя

module.exports = router;
