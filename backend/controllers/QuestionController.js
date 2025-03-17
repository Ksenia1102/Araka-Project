const { Question } = require('../models');

// 📌 Создание вопроса
async function createQuestion(req, res) {
    try {
        const { survey_id, text, correct_option } = req.body;

        if (!survey_id || !text) {
            return res.status(400).json({ message: 'survey_id и text обязательны' });
        }

        const question = await Question.create({
            survey_id,
            text,
            correct_option
        });

        return res.status(201).json(question);
    } catch (error) {
        console.error('Ошибка при создании вопроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение всех вопросов для опроса
async function getQuestionsBySurvey(req, res) {
    try {
        const { surveyId } = req.params;
        const questions = await Question.findAll({ where: { survey_id: surveyId } });

        if (!questions.length) {
            return res.status(404).json({ message: 'Вопросы не найдены' });
        }

        return res.status(200).json(questions);
    } catch (error) {
        console.error('Ошибка при получении вопросов:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение вопроса по ID
async function getQuestionById(req, res) {
    try {
        const { id } = req.params;
        const question = await Question.findByPk(id);

        if (!question) {
            return res.status(404).json({ message: 'Вопрос не найден' });
        }

        return res.status(200).json(question);
    } catch (error) {
        console.error('Ошибка при получении вопроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Обновление вопроса
async function updateQuestion(req, res) {
    try {
        const { id } = req.params;
        const { text, correct_option } = req.body;

        const question = await Question.findByPk(id);
        if (!question) {
            return res.status(404).json({ message: 'Вопрос не найден' });
        }

        question.text = text || question.text;
        question.correct_option = correct_option !== undefined ? correct_option : question.correct_option;
        await question.save();

        return res.status(200).json(question);
    } catch (error) {
        console.error('Ошибка при обновлении вопроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Удаление вопроса
async function deleteQuestion(req, res) {
    try {
        const { id } = req.params;

        const question = await Question.findByPk(id);
        if (!question) {
            return res.status(404).json({ message: 'Вопрос не найден' });
        }

        await question.destroy();

        return res.status(204).send(); // Ответ без контента
    } catch (error) {
        console.error('Ошибка при удалении вопроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    createQuestion,
    getQuestionsBySurvey,
    getQuestionById,
    updateQuestion,
    deleteQuestion
};
