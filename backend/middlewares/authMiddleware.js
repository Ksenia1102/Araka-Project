// // authMiddleware.js
// const jwt = require('jsonwebtoken');

// const jwtMiddleware = (req, res, next) => {
//     const token = req.headers['token'];
//     if (!token) {
//         return res.status(401).json({ error: 'Token not provided' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//         if (err) {
//             return res.status(401).json({ error: 'Invalid or expired token' });
//         }
//         req.user = decoded;
//         next();
//     });
// };

// module.exports = jwtMiddleware;

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // Проверяем токен в заголовке Authorization (формат Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Извлекаем токен из "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded; // Добавляем декодированные данные в запрос
        next();
    });
}

module.exports = authMiddleware;
