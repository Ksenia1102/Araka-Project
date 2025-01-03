const { Router } = require('express'); // Импортируем роутер из express для создания маршрутов
const mysql = require('mysql'); // Импортируем библиотеку для работы с MySQL
const dotenv = require('dotenv'); // Импортируем dotenv для загрузки переменных окружения
const router = Router(); // Создаем экземпляр роутера
const bcrypt = require('bcrypt'); // Для проверки пароля
const jwt = require('jsonwebtoken');
// const jwtDecode = require('jwt-express-decode');

dotenv.config({ path: '../backend/.env' }); // Загружаем переменные окружения из файла .env

// Настраиваем соединение с базой данных MySQL
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST, // Хост базы данных из переменных окружения
    user: process.env.DATABASE_USER, // Пользователь базы данных
    password: process.env.DATABASE_PASSWORD, // Пароль базы данных
    database: process.env.DATABASE // Имя базы данных
});

// Подключаемся к базе данных
db.connect((err) => {
    if (err) {
        console.log(err); // Выводим ошибку, если не удалось подключиться
    } else {
        console.log('MySQL Connected...'); // Успешное подключение
    }
});

// Middleware для проверки и декодирования JWT токена
function verifyToken(req, res, next) {
    const token = req.headers['authorization']; // Получаем токен из заголовка Authorization
    if (!token) {
        return res.status(401).send('Токен не предоставлен');
    }

    const tokenString = token.split(' ')[1]; // Извлекаем сам токен из строки "Bearer <token>"

    try {
        // Используем jwt.verify для проверки токена и получения данных
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET_KEY); // Декодируем токен и проверяем подпись
        req.userId = decoded.id; // Присваиваем decoded id пользователя в запрос
        next(); // Переход к следующему middleware или маршруту
    } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        return res.status(401).send('Неверный токен');
    }
}

// Пример защищенного маршрута, для которого требуется токен
router.get('/profile', verifyToken, (req, res) => {
    const userId = req.userId; // Получаем id пользователя из декодированного токена

    // SQL-запрос для получения информации о пользователе по id
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).send('Ошибка при получении данных пользователя');
        }
        if (results.length === 0) {
            return res.status(404).send('Пользователь не найден');
        }
        res.json(results[0]); // Отправляем информацию о пользователе
    });
});
// Маршрут для обработки POST-запроса на вход хеширования
router.post('/login', (req, res) => {
    console.log('Полученные данные для входа:', req.body);

    // Извлекаем login и password из тела запроса
    const { login, password } = req.body;

    // Проверяем, что логин и пароль указаны
    if (!login || !password) {
        return res.status(400).send('login и пароль обязательны');
    }

    // SQL-запрос для поиска пользователя по логину
    const query = 'SELECT * FROM users WHERE login = ?';
    db.query(query, [login], (err, results) => {
        if (err) {
            console.error(err); // Логируем ошибку, если она произошла
            return res.status(500).send('Ошибка при проверке данных пользователя');
        }
        // Если пользователь не найден
        if (results.length === 0) {
            return res.status(404).send('Пользователь не найден');
        }

        // Извлекаем пользователя из результата запроса
        const user = results[0];

        // Сравниваем хеш пароля с введённым паролем
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).send('Ошибка проверки пароля');
            if (!isMatch) return res.status(401).send('Неверный пароль');

            const token = jwt.sign({ id: user.id, login: user.login }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

            res.json({ message: 'Успешный вход', token });
        });
    });
});

module.exports = router;
