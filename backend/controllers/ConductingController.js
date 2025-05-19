const ConductingService = require('../services/ConductingService');
const { validationResult } = require('express-validator');
const TakenSurvey = require('../models/TakenSurvey');

class ConductingController {
    async startSession(req, res) {
        try {
            // 1. Валидация входных данных
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // 2. Вызов сервиса, передавая нужные параметры
            const { survey_id, class_id } = req.body;
            const sessionData = await ConductingService.startSession(survey_id, class_id);

            // 3. Отправка ответа клиенту
            res.status(200).json({
                status: 'success',
                data: sessionData
            });
        } catch (error) {
            console.error('Error starting session:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
    async getActiveSurvey(req, res) {
        try {
            const activeSurvey = await ConductingService.getActiveSurvey();
            res.status(200).json({
                active: !!activeSurvey,
                ...activeSurvey
            });
        } catch (error) {
            console.error('Error getting active survey:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }

    async getCurrentQuestion(req, res) {
        try {
            const currentQuestion = await ConductingService.getCurrentQuestion();
            console.log(currentQuestion);
            res.status(200).json({
                active: !!currentQuestion,
                ...currentQuestion
            });
        } catch (error) {
            console.error('Error getting current question:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
    async saveAnswers(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { taken_survey_id, taken_question_id, answers } = req.body;

            const result = await ConductingService.saveAnswers(taken_survey_id, taken_question_id, answers);

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            console.error('Error saving answers:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
    async stopSession(req, res) {
        try {
            const { survey_id, class_id } = req.body;

            if (!survey_id || !class_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Не указаны survey_id или class_id'
                });
            }

            // Обновляем только если тест активен
            const [updatedCount] = await TakenSurvey.update(
                {
                    is_active: false,
                    date: new Date()
                },
                {
                    where: {
                        survey_id: parseInt(survey_id),
                        class_id: parseInt(class_id),
                        is_active: true
                    }
                }
            );

            if (updatedCount === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Активный тест не найден'
                });
            }

            return res.json({
                status: 'success',
                message: 'Тест успешно остановлен',
                updatedCount
            });
        } catch (error) {
            console.error('Ошибка в stopSession:', error);
            return res.status(500).json({
                status: 'error',
                message: error.message || 'Ошибка сервера'
            });
        }
    }
}

module.exports = new ConductingController();
