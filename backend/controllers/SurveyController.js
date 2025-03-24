const SurveyService = require('../services/SurveyService');

class SurveyController {
    /**
     * Создание опроса с вопросами и вариантами ответов
     * POST /surveys
     * {
     *   "user_id": 1,
     *   "title": "Новый опрос",
     *   "questions": [
     *     {
     *       "text": "Вопрос 1",
     *       "correct_option": 0,
     *       "options": ["Вариант 1", "Вариант 2"]
     *     }
     *   ]
     * }
     */
    static async createSurvey(req, res) {
        try {
            const { user_id, title, questions } = req.body;

            // Валидация
            if (!user_id || !title || !questions?.length) {
                return res.status(400).json({ error: 'Необходимы user_id, title и вопросы' });
            }

            const survey = await SurveyService.createSurvey(user_id, title, questions);
            res.status(201).json(survey);
        } catch (error) {
            console.error('Ошибка создания опроса:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Получение опроса с вопросами и вариантами
     * GET /surveys/:id
     */
    static async getSurvey(req, res) {
        try {
            const survey = await SurveyService.getSurvey(req.params.id);

            if (!survey) {
                return res.status(404).json({ error: 'Опрос не найден' });
            }

            res.json({
                id: survey.id,
                title: survey.title,
                questions: survey.Questions.map((q) => ({
                    id: q.id,
                    text: q.text,
                    options: q.Options.map((o) => o.text),
                    correct_option: q.correct_option
                }))
            });
        } catch (error) {
            console.error('Ошибка получения опроса:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
}

module.exports = SurveyController;

// const { Survey } = require('../models');

// // 📌 Создание опроса
// async function createSurvey(req, res) {
//     try {
//         const { user_id, title } = req.body;

//         if (!user_id || !title) {
//             return res.status(400).json({ message: 'user_id и title обязательны' });
//         }

//         const survey = await Survey.create({
//             user_id,
//             title
//         });

//         return res.status(201).json(survey);
//     } catch (error) {
//         console.error('Ошибка при создании опроса:', error);
//         return res.status(500).json({ message: 'Ошибка сервера' });
//     }
// }

// // 📌 Получение всех опросов пользователя
// async function getSurveysByUser(req, res) {
//     try {
//         const { userId } = req.params;
//         const surveys = await Survey.findAll({ where: { user_id: userId } });

//         if (!surveys.length) {
//             return res.status(404).json({ message: 'Опросы не найдены' });
//         }

//         return res.status(200).json(surveys);
//     } catch (error) {
//         console.error('Ошибка при получении опросов:', error);
//         return res.status(500).json({ message: 'Ошибка сервера' });
//     }
// }

// // 📌 Получение опроса по ID
// async function getSurveyById(req, res) {
//     try {
//         const { id } = req.params;
//         const survey = await Survey.findByPk(id);

//         if (!survey) {
//             return res.status(404).json({ message: 'Опрос не найден' });
//         }

//         return res.status(200).json(survey);
//     } catch (error) {
//         console.error('Ошибка при получении опроса:', error);
//         return res.status(500).json({ message: 'Ошибка сервера' });
//     }
// }

// // 📌 Обновление опроса
// async function updateSurvey(req, res) {
//     try {
//         const { id } = req.params;
//         const { title } = req.body;

//         const survey = await Survey.findByPk(id);
//         if (!survey) {
//             return res.status(404).json({ message: 'Опрос не найден' });
//         }

//         survey.title = title || survey.title;
//         await survey.save();

//         return res.status(200).json(survey);
//     } catch (error) {
//         console.error('Ошибка при обновлении опроса:', error);
//         return res.status(500).json({ message: 'Ошибка сервера' });
//     }
// }

// // 📌 Удаление опроса
// async function deleteSurvey(req, res) {
//     try {
//         const { id } = req.params;

//         const survey = await Survey.findByPk(id);
//         if (!survey) {
//             return res.status(404).json({ message: 'Опрос не найден' });
//         }

//         await survey.destroy();

//         return res.status(204).send();
//     } catch (error) {
//         console.error('Ошибка при удалении опроса:', error);
//         return res.status(500).json({ message: 'Ошибка сервера' });
//     }
// }

// module.exports = {
//     createSurvey,
//     getSurveysByUser,
//     getSurveyById,
//     updateSurvey,
//     deleteSurvey
// };
// const SurveyService = require('../services/SurveyService');

// class SurveyController {
//     static async createSurvey(req, res) {
//         try {
//             const survey = await SurveyService.createSurvey(req.body.user_id, req.body.title, req.body.questions);
//             res.status(201).json(survey);
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }

//     static async getSurvey(req, res) {
//         try {
//             const survey = await SurveyService.getSurvey(req.params.surveyId);
//             survey ? res.json(survey) : res.status(404).json({ error: 'Survey not found' });
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }
// }

// module.exports = SurveyController;
