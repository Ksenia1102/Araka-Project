const { Option } = require('../models');

// 📌 Создание варианта ответа
async function createOption(req, res) {
    try {
        const { question_id, text } = req.body;

        if (!question_id || !text) {
            return res.status(400).json({ message: 'question_id и text обязательны' });
        }

        const option = await Option.create({
            question_id,
            text
        });

        return res.status(201).json(option);
    } catch (error) {
        console.error('Ошибка при создании варианта ответа:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение всех вариантов ответа для вопроса
async function getOptionsByQuestion(req, res) {
    try {
        const { questionId } = req.params;
        const options = await Option.findAll({ where: { question_id: questionId } });

        if (!options.length) {
            return res.status(404).json({ message: 'Варианты ответа не найдены' });
        }

        return res.status(200).json(options);
    } catch (error) {
        console.error('Ошибка при получении вариантов ответа:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение варианта ответа по ID
async function getOptionById(req, res) {
    try {
        const { id } = req.params;
        const option = await Option.findByPk(id);

        if (!option) {
            return res.status(404).json({ message: 'Вариант ответа не найден' });
        }

        return res.status(200).json(option);
    } catch (error) {
        console.error('Ошибка при получении варианта ответа:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Обновление варианта ответа
async function updateOption(req, res) {
    try {
        const { id } = req.params;
        const { text } = req.body;

        const option = await Option.findByPk(id);
        if (!option) {
            return res.status(404).json({ message: 'Вариант ответа не найден' });
        }

        option.text = text || option.text;
        await option.save();

        return res.status(200).json(option);
    } catch (error) {
        console.error('Ошибка при обновлении варианта ответа:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Удаление варианта ответа
async function deleteOption(req, res) {
    try {
        const { id } = req.params;

        const option = await Option.findByPk(id);
        if (!option) {
            return res.status(404).json({ message: 'Вариант ответа не найден' });
        }

        await option.destroy();

        return res.status(204).send(); // Ответ без контента
    } catch (error) {
        console.error('Ошибка при удалении варианта ответа:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    createOption,
    getOptionsByQuestion,
    getOptionById,
    updateOption,
    deleteOption
};
