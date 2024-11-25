const { Router } = require('express'); // Импортируем роутер из express для создания маршрутов
const mysql = require('mysql'); // Импортируем библиотеку для работы с MySQL
const dotenv = require('dotenv'); // Импортируем dotenv для загрузки переменных окружения
const router = Router(); // Создаем экземпляр роутера
const bcrypt = require('bcrypt'); // Для проверки пароля
const jwt = require('jsonwebtoken');

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

// Маршрут для обработки POST-запроса на вход без хеширования
// router.post('/login', (req, res) => {
//     console.log('Полученные данные для входа:', req.body);

//     // Извлекаем login и password из тела запроса
//     const { login, password } = req.body;

//     // Проверяем, что логин и пароль указаны
//     if (!login || !password) {
//         return res.status(400).send('Логин и пароль обязательны');
//     }

//     // SQL-запрос для поиска пользователя по логину
//     const query = 'SELECT * FROM users WHERE login = ?';
//     db.query(query, [login], (err, results) => {
//         if (err) {
//             console.error(err); // Логируем ошибку, если она произошла
//             return res.status(500).send('Ошибка при проверке данных пользователя');
//         }

//         // Если пользователь не найден
//         if (results.length === 0) {
//             return res.status(404).send('Пользователь не найден');
//         }

//         // Извлекаем пользователя из результата запроса
//         const user = results[0];

//         // Сравниваем введённый пароль с паролем из базы данных
//         if (user.password === password) {
//             // Если пароли совпали, то вход успешен
//             res.status(200).send('Успешный вход');
//         } else {
//             // Если пароли не совпадают, возвращаем ошибку
//             res.status(401).send('Неверный пароль');
//         }
//     });
// });

// //Вход и регистрация с хешированием, если тебе надо, Настя
// const saltRounds = 10;

// router.post('/register', (req, res) => {
//     const { login, password } = req.body;

//     if (!login || !password) {
//         return res.status(400).send('login и пароль обязательны');
//     }

//     bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).send('Ошибка при хешировании пароля');
//         }

//         const query = 'INSERT INTO users (login, password) VALUES (?, ?)';
//         db.query(query, [login, hashedPassword], (err) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).send('Ошибка при добавлении пользователя');
//             }
//             res.status(201).send('Пользователь зарегистрирован');
//         });
//     });
// });

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
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка при проверке пароля');
            }

            if (isMatch) {
                // Генерация JWT
                const payload = { id: user.id, login: user.login }; // Данные для полезной нагрузки
                const secret = process.env.JWT_SECRET_KEY; // Секретный ключ для подписи

                const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Создаем токен, срок действия 1 час

                // Отправляем токен обратно клиенту
                res.status(200).json({ message: 'Успешный вход', token });
            } else {
                res.status(401).send('Неверный пароль');
            }
        });
    });
});

module.exports = router;
