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

// Маршрут для обработки POST-запроса на вход без хеширования
router.post('/login', (req, res) => {
    console.log('Полученные данные для входа:', req.body);

    // Извлекаем login и password из тела запроса
    const { login, password } = req.body;

    // Проверяем, что логин и пароль указаны
    if (!login || !password) {
        return res.status(400).send('Логин и пароль обязательны');
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

        // Сравниваем введённый пароль с паролем из базы данных
        if (user.password === password) {
            // Если пароли совпали, то вход успешен
            res.status(200).send('Успешный вход');
        } else {
            // Если пароли не совпадают, возвращаем ошибку
            res.status(401).send('Неверный пароль');
        }
    });
});

module.exports = router;

//Вход и регистрация с хешированием, если тебе надо, Настя
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

router.post('/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).send('login и пароль обязательны');
    }

    const query = 'SELECT * FROM users WHERE login = ?';
    db.query(query, [login], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при проверке данных пользователя');
        }

        if (results.length === 0) {
            return res.status(404).send('Пользователь не найден');
        }

        const user = results[0];

        // Сравниваем хеш пароля с введённым паролем
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка при проверке пароля');
            }

            if (isMatch) {
                res.status(200).send('Успешный вход');
            } else {
                res.status(401).send('Неверный пароль');
            }
        });
    });
});
