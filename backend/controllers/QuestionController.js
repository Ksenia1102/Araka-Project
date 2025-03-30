// /src/controllers/QuestionController.js
const QuestionService = require('../services/QuestionService');

class QuestionController {
    static async addQuestions(req, res) {
        const { survey_id, questions } = req.body; // Получаем ID опроса и вопросы

        try {
            const createdQuestions = await QuestionService.addQuestions(survey_id, questions);
            res.status(201).json({ createdQuestions });
        } catch (error) {
            console.error('Ошибка при добавлении вопросов:', error);
            res.status(500).json({ message: 'Ошибка при добавлении вопросов' });
        }
    }
}

module.exports = QuestionController;
