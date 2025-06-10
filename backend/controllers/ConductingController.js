const ConductingService = require('../services/ConductingService');
const { validationResult } = require('express-validator');
const { getSession, setSession } = require('../utils');
const { Class, Student, Survey, TakenSurvey, TakenQuestion, TakenQuestionAnswer } = require('../models');

class ConductingController {
    constructor() {
        this.startSession = this.startSession.bind(this);
        this.getActiveSurvey = this.getActiveSurvey.bind(this);
        this.getCurrentQuestion = this.getCurrentQuestion.bind(this);
        this.saveAnswers = this.saveAnswers.bind(this);
        this.stopSession = this.stopSession.bind(this);
        this.getClassStudents = this.getClassStudents.bind(this);
        this.getStudentAnswers = this.getStudentAnswers.bind(this);
        this.handleError = this.handleError.bind(this); // Добавляем привязку для handleError
    }
    async getClassStudents(req, res) {
        try {
            const { class_id } = req.query;
            if (!class_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Не указан class_id'
                });
            }

            // Проверяем доступ пользователя к классу
            const userClasses = await Class.findAll({
                where: { user_id: req.user.id },
                attributes: ['id']
            });
            const userClassIds = userClasses.map((c) => c.id);

            if (!userClassIds.includes(parseInt(class_id))) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Нет доступа к указанному классу'
                });
            }

            // Получаем студентов класса
            const students = await Student.findAll({
                where: { class_id },
                attributes: ['id', 'name', 'aruco_num'],
                order: [['name', 'ASC']]
            });

            res.status(200).json({
                status: 'success',
                data: students
            });
        } catch (error) {
            console.error('Error in getClassStudents:', error);
            this.handleError(res, error);
        }
    }

    async getStudentAnswers(req, res) {
        try {
            const { survey_id } = req.query;
            if (!survey_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Не указан survey_id'
                });
            }

            // Проверяем доступ пользователя к опросу
            const userSurveys = await Survey.findAll({
                where: { user_id: req.user.id },
                attributes: ['id']
            });
            const userSurveyIds = userSurveys.map((s) => s.id);

            if (!userSurveyIds.includes(parseInt(survey_id))) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Нет доступа к указанному опросу'
                });
            }

            // Получаем ответы студентов
            const answers = await TakenQuestionAnswer.findAll({
                include: [
                    {
                        model: Student,
                        attributes: ['id', 'name'],
                        required: true
                    },
                    {
                        model: TakenQuestion,
                        attributes: ['id'],
                        include: [
                            {
                                model: TakenSurvey,
                                where: { survey_id },
                                attributes: []
                            }
                        ],
                        required: true
                    }
                ],
                attributes: ['id', 'answer', 'createdAt'],
                order: [['createdAt', 'DESC']]
            });

            const formattedAnswers = answers.map((answer) => ({
                id: answer.id,
                student_id: answer.student.id,
                student_name: answer.student.name,
                answer: answer.answer,
                date: answer.createdAt
            }));

            res.status(200).json({
                status: 'success',
                data: formattedAnswers
            });
        } catch (error) {
            console.error('Error in getStudentAnswers:', error);
            this.handleError(res, error);
        }
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
            const result = await ConductingService.saveAnswers(taken_survey_id, taken_question_id, answers);

            if (result.status === 'survey_completed') {
                this.sendWsAndDeleteSession(req.app, req.user.id, result.frontendData);
            } else if (result.status === 'next_question') {
                this.sendWsAndSetSession(req.app, req.user.id, result.frontendData);
            }

            res.status(200).json({
                status: 'success',
                data: result.mobileData
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }
    // результаты студентов (класс - тест)
    async getSurveyResults(req, res) {
        console.log('start');
        const { classId, surveyId } = req.params;

        try {
            const results = await ConductingService.getSurveyResults(classId, surveyId);
            res.json(results);
        } catch (error) {
            console.error('Ошибка в контроллере getSurveyResults:', error);
            res.status(500).json({ message: 'Ошибка при получении ответов студентов' });
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
            this.sendWsAndDeleteSession(req.app, req.user.id, {});

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

    sendWsAndDeleteSession(app, userId, frontendData) {
        const sendToUser = app.get('sendToUser');
        sendToUser(userId, { type: 'session_stopped', data: frontendData });
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
