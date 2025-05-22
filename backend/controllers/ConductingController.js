const ConductingService = require('../services/ConductingService');
const { validationResult } = require('express-validator');
const TakenSurvey = require('../models/TakenSurvey');
const { getSession, setSession } = require('../utils');

class ConductingController {
    constructor() {
        this.startSession = this.startSession.bind(this);
        this.getActiveSurvey = this.getActiveSurvey.bind(this);
        this.getCurrentQuestion = this.getCurrentQuestion.bind(this);
        this.saveAnswers = this.saveAnswers.bind(this);
        this.stopSession = this.stopSession.bind(this);
    }
    async startSession(req, res) {
        try {
            // 1. Валидация входных данных
            this.validate(req);

            // 2. Вызов сервиса, передавая нужные параметры
            const { survey_id, class_id } = req.body;
            const { mobileData, frontendData } = await ConductingService.startSession(req.user.id, survey_id, class_id);
            console.log('[WS] Sending session_started to user:', req.user.id);

            this.sendWsAndSetSession(req.app, req.user.id, frontendData);

            // 3. Отправка ответа клиенту
            res.status(200).json({
                status: 'success',
                data: mobileData
            });
        } catch (error) {
            this.handleError(res, error);
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
            this.handleError(res, error);
        }
    }

    async getCurrentQuestion(req, res) {
        try {
            const data = getSession(req.user.id);
            if (!data) {
                return res.status(200).json({ active: false });
            }
            res.status(200).json({
                active: !!data,
                ...data
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }
    async saveAnswers(req, res) {
        try {
            this.validate(req);

            const { taken_survey_id, taken_question_id, answers } = req.body;
            const { mobileData, frontendData } = await ConductingService.saveAnswers(taken_survey_id, taken_question_id, answers);

            this.sendWsAndSetSession(req.app, req.user.id, frontendData);

            res.status(200).json({
                status: 'success',
                data: mobileData
            });
        } catch (error) {
            this.handleError(res, error);
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

    validate(req) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err = new Error('Validation failed');
            err.statusCode = 400;
            err.data = errors.array();
            throw err;
        }
    }

    sendWsAndSetSession(app, userId, frontendData) {
        const sendToUser = app.get('sendToUser');
        sendToUser(userId, { type: 'session_started', data: frontendData });
        setSession(userId, frontendData);
    }

    handleError(res, error) {
        console.error(error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal server error',
            ...(error.data && { errors: error.data })
        });
    }
}

module.exports = new ConductingController();
