// src/controllers/AuthController.js
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Регистрация пользователя
async function register(req, res) {
    const { login, password, name, surname } = req.body;

    // Проверка на обязательные поля
    if (!login || !password || !name || !surname) {
        return res.status(400).send('Все поля обязательны');
    }

    try {
        // Проверяем, существует ли уже пользователь с таким логином
        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.status(400).send('Пользователь с таким логином уже существует');
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем нового пользователя
        const newUser = await User.create({
            login,
            password: hashedPassword,
            name,
            surname
        });

        res.status(201).json({ message: 'Пользователь зарегистрирован', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при регистрации пользователя');
    }
}

// Вход пользователя
async function login(req, res) {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).send('Логин и пароль обязательны');
    }

    try {
        const user = await User.findOne({ where: { login } });
        if (!user) {
            return res.status(404).send('Пользователь не найден');
        }

        // Сравниваем введённый пароль с хешированным паролем
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Неверный пароль');
        }

        // Создаем JWT токен
        const token = jwt.sign({ id: user.id, login: user.login }, process.env.JWT_SECRET_KEY, { expiresIn: '10h' });

        res.json({ message: 'Успешный вход', token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при проверке данных пользователя');
    }
}

// Получение профиля пользователя
async function getProfile(req, res) {
    const userId = req.userId;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send('Пользователь не найден');
        }

        res.json(user); // Отправляем информацию о пользователе
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении данных пользователя');
    }
}

module.exports = {
    register,
    login,
    getProfile
};
