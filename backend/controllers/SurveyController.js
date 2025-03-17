const { Survey } = require('../models');

// 📌 Создание опроса
async function createSurvey(req, res) {
    try {
        const { user_id, title } = req.body;

        if (!user_id || !title) {
            return res.status(400).json({ message: 'user_id и title обязательны' });
        }

        const survey = await Survey.create({
            user_id,
            title
        });

        return res.status(201).json(survey);
    } catch (error) {
        console.error('Ошибка при создании опроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение всех опросов пользователя
async function getSurveysByUser(req, res) {
    try {
        const { userId } = req.params;
        const surveys = await Survey.findAll({ where: { user_id: userId } });

        if (!surveys.length) {
            return res.status(404).json({ message: 'Опросы не найдены' });
        }

        return res.status(200).json(surveys);
    } catch (error) {
        console.error('Ошибка при получении опросов:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение опроса по ID
async function getSurveyById(req, res) {
    try {
        const { id } = req.params;
        const survey = await Survey.findByPk(id);

        if (!survey) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }

        return res.status(200).json(survey);
    } catch (error) {
        console.error('Ошибка при получении опроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Обновление опроса
async function updateSurvey(req, res) {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const survey = await Survey.findByPk(id);
        if (!survey) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }

        survey.title = title || survey.title;
        await survey.save();

        return res.status(200).json(survey);
    } catch (error) {
        console.error('Ошибка при обновлении опроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Удаление опроса
async function deleteSurvey(req, res) {
    try {
        const { id } = req.params;

        const survey = await Survey.findByPk(id);
        if (!survey) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }

        await survey.destroy();

        return res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении опроса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    createSurvey,
    getSurveysByUser,
    getSurveyById,
    updateSurvey,
    deleteSurvey
};
