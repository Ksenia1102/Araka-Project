const SurveyService = require('../services/SurveyService');
// const QuestionService = require('../services/QuestionService');
class SurveyController {
    static async getSurvey(req, res) {
        try {
            const surveyId = parseInt(req.params.id);
            if (isNaN(surveyId)) {
                return res.status(400).json({ error: 'Invalid survey ID' });
            }

            const survey = await SurveyService.getSurveyById(surveyId);
            if (!survey) {
                return res.status(404).json({ error: 'Survey not found' });
            }

            // Форматируем ответ для фронтенда
            const response = {
                id: survey.id,
                title: survey.title,
                createdAt: survey.createdAt,
                questions: survey.questions.map((question) => ({
                    id: question.id,
                    text: question.text,
                    correct_option_id: question.correctOption, // Изменено на correct_option_id
                    options: question.options.map((option) => ({
                        id: option.id,
                        text: option.text,
                        // Добавляем isCorrect для удобства фронтенда
                        isCorrect: option.id === question.correctOption
                    }))
                }))
            };

            res.json(response);
        } catch (error) {
            console.error('Error in getSurvey:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    static async getUserSurveys(req, res) {
        try {
            const surveys = await SurveyService.getSurveysByUserId(req.user.id);

            // Форматируем ответ
            const response = surveys.map((survey) => ({
                id: survey.id,
                title: survey.title,
                createdAt: survey.created_at,
                questionCount: survey.questions ? survey.questions.length : 0
            }));

            res.json(response);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createSurvey(req, res) {
        try {
            const { user_id, title, questions } = req.body;

            // Валидация
            if (!user_id || !title || !Array.isArray(questions)) {
                return res.status(400).json({ error: 'Параметры запроса некорректны' });
            }

            // Создание опроса через сервис
            const survey = await SurveyService.createSurveyWithQuestions({
                user_id,
                title,
                questions
            });

            res.status(201).json({
                message: 'Опрос успешно сохранен',
                surveyId: survey.id
            });
        } catch (error) {
            console.error('Ошибка при создании опроса:', error);
            res.status(500).json({
                error: error.message || 'Ошибка при сохранении опроса'
            });
        }
    }

    static async copySurvey(req, res) {
        try {
            const newSurvey = await SurveyService.copySurvey(req.params.survey_id, req.user.id);
            res.status(201).json(newSurvey);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteSurvey(req, res) {
        try {
            await SurveyService.deleteSurvey(req.params.survey_id);
            res.json({ message: 'Survey deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateSurvey(req, res) {
        try {
            const surveyId = parseInt(req.params.id);
            if (isNaN(surveyId)) {
                return res.status(400).json({ error: 'Invalid survey ID' });
            }

            const { user_id, title, questions } = req.body;

            // Validate input
            if (!user_id || !title || !Array.isArray(questions)) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    details: {
                        requires: ['user_id', 'title', 'questions'],
                        received: Object.keys(req.body)
                    }
                });
            }

            // Call the service
            const updatedSurvey = await SurveyService.updateSurvey(surveyId, user_id, { title, questions });

            return res.json(updatedSurvey);
        } catch (error) {
            console.error('Error updating survey:', error);

            const statusCode = error.message.includes('not found') ? 404 : 500;

            res.status(statusCode).json({
                error: error.message.includes('not found') ? error.message : 'Internal server error',
                details:
                    process.env.NODE_ENV === 'development'
                        ? {
                              message: error.message,
                              stack: error.stack
                          }
                        : undefined
            });
        }
    }
}

module.exports = SurveyController;
