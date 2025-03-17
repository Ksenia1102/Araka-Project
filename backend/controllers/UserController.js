// src/controllers/UserController.js
const { User } = require('../models');

// Создание пользователя
async function createUser(req, res) {
    try {
        const { login, password, name, surname } = req.body;

        const user = await User.create({
            login,
            password,
            name,
            surname
        });

        return res.status(201).json(user); // Возвращаем созданного пользователя
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Ошибка при создании пользователя' });
    }
}

// Получение пользователя по id
async function getUser(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Ошибка при получении пользователя' });
    }
}

// Обновление данных пользователя
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { login, password, name, surname } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.login = login || user.login;
        user.password = password || user.password;
        user.name = name || user.name;
        user.surname = surname || user.surname;

        await user.save(); // Сохраняем изменения

        return res.status(200).json(user); // Возвращаем обновленного пользователя
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
}

// Удаление пользователя
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        await user.destroy(); // Удаляем пользователя

        return res.status(204).send(); // Ответ без контента
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Ошибка при удалении пользователя' });
    }
}

module.exports = {
    createUser,
    getUser,
    updateUser,
    deleteUser
};
