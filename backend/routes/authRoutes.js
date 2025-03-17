// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const verifyToken = require('../middlewares/verifyToken');

// Роуты для регистрации и входа
router.post('/register', AuthController.register); // Регистрация
router.post('/login', AuthController.login); // Вход
router.get('/profile', verifyToken, AuthController.getProfile); // Профиль пользователя

module.exports = router;
