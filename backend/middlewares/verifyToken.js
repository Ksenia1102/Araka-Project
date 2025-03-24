///middlewares/verifyToken.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['authorization']; // Получаем токен из заголовка Authorization
    if (!token) {
        return res.status(401).send('Токен не предоставлен');
    }

    const tokenString = token.split(' ')[1]; // Извлекаем сам токен из строки "Bearer <token>"

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET_KEY); // Декодируем токен
        req.userId = decoded.id; // Присваиваем decoded id пользователя в запрос
        next(); // Переход к следующему middleware или маршруту
    } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        return res.status(401).send('Неверный токен');
    }
}

module.exports = verifyToken;
