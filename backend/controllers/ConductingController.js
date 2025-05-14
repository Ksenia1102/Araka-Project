const ConductingService = require('../services/ConductingService');
const { validationResult } = require('express-validator');
const TakenSurvey = require('../models/TakenSurvey');

class ConductingController {
    async startSession(req, res) {
        try {
            // Валидация входных данных
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { survey_id, class_id } = req.body;
            
            // Атомарная операция поиска/создания/обновления
            const [survey, created] = await TakenSurvey.findOrCreate({
                where: {
                    survey_id: parseInt(survey_id),
                    class_id: parseInt(class_id)
                },
                defaults: {
                    is_active: true,
                    date: new Date(),
                    // Другие обязательные поля
                }
            });

            // Если запись существовала, но была неактивна
            if (!created && !survey.is_active) {
                await survey.update({
                    is_active: true,
                    date: new Date()
                });
            }

            // Возвращаем результат без дополнительного создания в ConductingService
            res.status(200).json({
                status: 'success',
                data: {
                    taken_survey_id: survey.id,
                    survey_title: survey.survey_title,
                    class_name: survey.class_name,
                    was_created: created,
                    was_reactivated: !created && !survey.is_active
                }
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
