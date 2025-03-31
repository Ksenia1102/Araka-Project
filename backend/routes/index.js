const express = require('express');
const router = express.Router();

// Импортируем модули маршрутов
// const registrationRoutes = require('./registration');
// const loginRoutes = require('./login');
// const surveyRoutes = require('./surveys');
// const getSurveysRoutes = require('./get_surveys');
// const questionsRoutes = require('./get_questions');
const downloadCardsRoutes = require('./download_cards');
const downloadCardsRoutes1 = require('./download_cards_1');
// const profileRoutes = require('./profile');
// const createClassRouter = require('./classes');
// const saveStudentsRouter = require('./students');
// const quizRouter = require('./quiz');

// Подключаем маршруты
// router.use('/registration', registrationRoutes);
// router.use('/login', loginRoutes);
// router.use('/', surveyRoutes);
// router.use('/', getSurveysRoutes);
// router.use('/', questionsRoutes);
router.use('/cards', downloadCardsRoutes);
router.use('/cards', downloadCardsRoutes1);
// router.use('/profile', profileRoutes);
// router.use('/classes', createClassRouter);
// router.use('/students', saveStudentsRouter);

// router.use('/', quizRouter);

module.exports = router;
