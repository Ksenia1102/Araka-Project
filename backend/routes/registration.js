const { Router } = require('express'); // Импортируем роутер из express для создания маршрутов
const mysql = require('mysql'); // Импортируем библиотеку для работы с MySQL
const dotenv = require('dotenv'); // Импортируем dotenv для загрузки переменных окружения
const router = Router(); // Создаем экземпляр роутера

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

// Маршрут для обработки POST-запроса на регистрацию
router.post('/register', (req, res) => {
    console.log('Полученные данные:', req.body); // Логируем входные данные для проверки

    // Извлекаем login и password из тела запроса
    const { login, password } = req.body;

    // Проверяем, что логин и пароль указаны
    if (!login || !password) {
        return res.status(400).send('login и пароль обязательны'); // Если нет, возвращаем ошибку
    }

    // SQL-запрос для добавления нового пользователя в таблицу users
    const query = 'INSERT INTO users (login, password) VALUES (?, ?)';
    db.query(query, [login, password], (err) => {
        if (err) {
            console.error(err); // Выводим ошибку, если что-то пошло не так
            return res.status(500).send('Ошибка при добавлении пользователя'); // Возвращаем ошибку сервера
        }
        res.status(201).send('Пользователь зарегистрирован'); // Сообщаем об успешной регистрации
    });
});

module.exports = router; // Экспортируем роутер для использования в других частях приложения
