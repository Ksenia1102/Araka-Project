const { User } = require('../models');
const bcrypt = require('bcrypt');

// Функция для создания пользователя
async function createUser({ login, password, name, surname, email }) {
    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ where: { login } });
    if (existingUser) {
        throw new Error('Пользователь с таким логином уже существует');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    return await User.create({
        login,
        password: hashedPassword,
        name,
        surname,
        email
    });
}

module.exports = { createUser };
