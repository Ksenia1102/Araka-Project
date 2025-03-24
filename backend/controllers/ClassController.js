///controllers/ClassController.js
const { Class } = require('../models');

// Создание класса
async function createClass(req, res) {
    try {
        const { user_id, title } = req.body;

        if (!user_id || !title) {
            return res.status(400).json({ message: 'user_id и title обязательны' });
        }

        const newClass = await Class.create({ user_id, title });

        return res.status(201).json(newClass);
    } catch (error) {
        console.error('Ошибка при создании класса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// Получение всех классов пользователя
async function getUserClasses(req, res) {
    try {
        const { userId } = req.params;
        const classes = await Class.findAll({ where: { user_id: userId } });

        return res.status(200).json(classes);
    } catch (error) {
        console.error('Ошибка при получении классов:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// Получение одного класса по ID
async function getClassById(req, res) {
    try {
        const { id } = req.params;
        const foundClass = await Class.findByPk(id);

        if (!foundClass) {
            return res.status(404).json({ message: 'Класс не найден' });
        }

        return res.status(200).json(foundClass);
    } catch (error) {
        console.error('Ошибка при получении класса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// Обновление класса
async function updateClass(req, res) {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const foundClass = await Class.findByPk(id);
        if (!foundClass) {
            return res.status(404).json({ message: 'Класс не найден' });
        }

        foundClass.title = title || foundClass.title;
        await foundClass.save();

        return res.status(200).json(foundClass);
    } catch (error) {
        console.error('Ошибка при обновлении класса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// Удаление класса
async function deleteClass(req, res) {
    try {
        const { id } = req.params;

        const foundClass = await Class.findByPk(id);
        if (!foundClass) {
            return res.status(404).json({ message: 'Класс не найден' });
        }

        await foundClass.destroy();

        return res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении класса:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    createClass,
    getUserClasses,
    getClassById,
    updateClass,
    deleteClass
};
