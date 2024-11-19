const { Router } = require('express'); // Импортируем роутер из express для создания маршрутов
const mysql = require('mysql'); // Импортируем библиотеку для работы с MySQL
const dotenv = require('dotenv'); // Импортируем dotenv для загрузки переменных окружения
const router = Router(); // Создаем экземпляр роутера
const bcrypt = require('bcrypt'); // Для проверки пароля

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

const saltRounds = 10;

router.post('/register', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).send('login и пароль обязательны');
    }

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при хешировании пароля');
        }

        const query = 'INSERT INTO users (login, password) VALUES (?, ?)';
        db.query(query, [login, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка при добавлении пользователя');
            }
            res.status(201).send('Пользователь зарегистрирован');
        });
    });
});

module.exports = router; // Экспортируем роутер для использования в других частях приложения
