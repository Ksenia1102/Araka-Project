// src/controllers/UserController.js
const { User } = require('../models');
const { createUser } = require('../services/UserService');
// Создание пользователя
async function createUserHandler(req, res) {
    try {
        const user = await createUser(req.body);
        return res.status(201).json(user);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// Получение пользователя по id
async function getUser(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'surname', 'login', 'email', 'createdAt'] // Явно указываем поля
        });
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
        const { login, password, name, surname, email } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.login = login || user.login;
        user.password = password || user.password;
        user.name = name || user.name;
        user.surname = surname || user.surname;
        user.email = email || user.email;

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
    createUserHandler,
    getUser,
    updateUser,
    deleteUser
};
