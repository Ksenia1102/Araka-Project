const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
console.log('Загруженный JWT_SECRET:', process.env.JWT_SECRET_KEY);
// process.env.

class AuthService {
    static async register(login, password) {
        console.log('Пароль перед хешированием:', password);
        login = login.trim(); // Убираем пробелы
        password = password.trim();
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Хешированный пароль:', hashedPassword);
        const user = await User.create({ login, password: hashedPassword });
        console.log('Пользователь после регистрации:', user);
        return user;
    }

    static async login(login, password) {
        console.log('Логин, который пришёл:', login);
        const user = await User.findOne({ where: { login } });
        if (!user) throw new Error('User not found');

        console.log('Пароль, который пришёл для логина:', password);
        console.log('Хеш из базы данных:', user.password); // Хеш из базы данных

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Результат сравнения пароля с хешом:', isMatch); // Должно вывести true

        if (!isMatch) {
            console.error('Пароли не совпадают!');
            throw new Error('Invalid password');
        }

        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
            throw new Error('Ошибка сервера: секретный ключ JWT не задан');
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '10h' });
        return token;
    }
}

module.exports = AuthService;
