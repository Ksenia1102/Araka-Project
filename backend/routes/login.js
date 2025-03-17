const { Router } = require('express');
const dotenv = require('dotenv');
const router = Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { queryAsync } = require('./db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

dotenv.config({ path: '../backend/.env' });

// Настройка nodemailer для отправки писем
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Генерация случайного кода подтверждения
const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-значный код
};

// Маршрут для запроса восстановления пароля
router.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Почта обязательна');
    }

    try {
        // Проверяем, существует ли пользователь с такой почтой
        const query = 'SELECT * FROM users WHERE email = ?';
        const results = await queryAsync(query, [email]);

        if (results.length === 0) {
            return res.status(404).send('Пользователь с такой почтой не найден');
        }

        // Генерация кода подтверждения
        const resetCode = generateVerificationCode();

        // Хеширование кода подтверждения
        const hashedResetCode = await bcrypt.hash(resetCode, 10);

        // Сохраняем хэшированный код в базе данных
        const updateQuery = 'UPDATE users SET resetCode = ? WHERE email = ?';
        await queryAsync(updateQuery, [hashedResetCode, email]);

        // Отправка письма с кодом подтверждения
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Восстановление пароля',
            text: `Ваш код подтверждения: ${resetCode}`,
            html: `<p>Ваш код подтверждения: <strong>${resetCode}</strong></p>`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Ошибка при отправке письма:', err);
                return res.status(500).send('Ошибка при отправке письма');
            }
            console.log('Письмо отправлено:', info.response);
            res.status(200).send('Код подтверждения отправлен на вашу почту');
        });
    } catch (err) {
        console.error('Ошибка при запросе восстановления пароля:', err);
        res.status(500).send('Ошибка при запросе восстановления пароля');
    }
});

// Маршрут для проверки кода подтверждения
router.post('/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).send('Почта и код обязательны');
    }

    try {
        // Получаем пользователя по email
        const query = 'SELECT * FROM users WHERE email = ?';
        const results = await queryAsync(query, [email]);

        if (results.length === 0) {
            return res.status(404).send('Пользователь с такой почтой не найден');
        }

        const user = results[0];

        // Сравниваем хэшированный код с введенным кодом
        const isMatch = await bcrypt.compare(code, user.resetCode);
        if (!isMatch) {
            return res.status(400).send('Неверный код подтверждения');
        }

        res.status(200).send('Код подтверждения верен');
    } catch (err) {
        console.error('Ошибка при проверке кода:', err);
        res.status(500).send('Ошибка при проверке кода');
    }
});

// Маршрут для обновления пароля
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).send('Почта, код и новый пароль обязательны');
    }

    try {
        // Получаем пользователя по email
        const query = 'SELECT * FROM users WHERE email = ?';
        const results = await queryAsync(query, [email]);

        if (results.length === 0) {
            return res.status(404).send('Пользователь с такой почтой не найден');
        }

        const user = results[0];

        // Сравниваем хэшированный код с введенным кодом
        const isMatch = await bcrypt.compare(code, user.resetCode);
        if (!isMatch) {
            return res.status(400).send('Неверный код подтверждения');
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль и очищаем resetCode
        const updateQuery = 'UPDATE users SET password = ?, resetCode = NULL WHERE email = ?';
        await queryAsync(updateQuery, [hashedPassword, email]);

        res.status(200).send('Пароль успешно обновлен');
    } catch (err) {
        console.error('Ошибка при обновлении пароля:', err);
        res.status(500).send('Ошибка при обновлении пароля');
    }
});

// Маршрут для входа пользователя
router.post('/login', async (req, res) => {
    const { loginOrEmail, password } = req.body;

    if (!loginOrEmail || !password) {
        return res.status(400).send('Логин/почта и пароль обязательны');
    }

    try {
        // Определяем, является ли введенное значение почтой
        const isEmail = loginOrEmail.includes('@');

        // SQL-запрос для поиска пользователя по логину или почте
        const query = isEmail
            ? 'SELECT * FROM users WHERE email = ?' // Если это почта
            : 'SELECT * FROM users WHERE login = ?'; // Если это логин

        const results = await queryAsync(query, [loginOrEmail]);

        // Если пользователь не найден
        if (results.length === 0) {
            return res.status(404).send('Пользователь не найден');
        }

        // Извлекаем пользователя из результата запроса
        const user = results[0];

        // Сравниваем хеш пароля с введённым паролем
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Неверный пароль');
        }

        // Генерация JWT токена
        const token = jwt.sign({ id: user.id, login: user.login }, process.env.JWT_SECRET_KEY, { expiresIn: '10h' });

        res.json({ message: 'Успешный вход', token });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).send('Ошибка при входе');
    }
});

module.exports = router;