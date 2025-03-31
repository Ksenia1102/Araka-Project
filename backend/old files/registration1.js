const { Router } = require('express'); // Импортируем роутер из express для создания маршрутов
const mysql = require('mysql'); // Импортируем библиотеку для работы с MySQL
const dotenv = require('dotenv'); // Импортируем dotenv для загрузки переменных окружения
const router = Router(); // Создаем экземпляр роутера
const bcrypt = require('bcrypt'); // Для хеширования пароля и кода подтверждения
const nodemailer = require('nodemailer'); // Для отправки писем
const crypto = require('crypto'); // Для генерации кода подтверждения

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

const saltRounds = 10; // Количество раундов для хеширования пароля и кода

// Настройка nodemailer для Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail', // Используем Gmail
    auth: {
        user: process.env.EMAIL_USER, // Ваш Gmail-адрес
        pass: process.env.EMAIL_PASSWORD // Пароль приложения
    }
});

// Генерация случайного кода подтверждения
const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-значный код
};

// Роут для регистрации пользователя
router.post('/register', (req, res) => {
    const { login, email, password } = req.body;

    // Проверка на пустые поля
    if (!login || !email || !password) {
        return res.status(400).send('Логин, почта и пароль обязательны');
    }

    // Проверка на уникальность логина и почты
    const checkUserQuery = 'SELECT * FROM users WHERE login = ? OR email = ?';
    db.query(checkUserQuery, [login, email], (err, results) => {
        if (err) {
            console.error('Ошибка при проверке пользователя:', err);
            return res.status(500).send('Ошибка при проверке пользователя');
        }

        if (results.length > 0) {
            const existingUser = results[0];
            if (existingUser.login === login) {
                return res.status(400).send('Логин уже занят');
            }
            if (existingUser.email === email) {
                return res.status(400).send('Почта уже занята');
            }
        }

        // Генерация кода подтверждения
        const verificationCode = generateVerificationCode();

        // Хеширование пароля и кода подтверждения
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Ошибка при хешировании пароля:', err);
                return res.status(500).send('Ошибка при хешировании пароля');
            }

            bcrypt.hash(verificationCode, saltRounds, (err, hashedVerificationCode) => {
                if (err) {
                    console.error('Ошибка при хешировании кода подтверждения:', err);
                    return res.status(500).send('Ошибка при хешировании кода подтверждения');
                }

                // Запрос для добавления пользователя в базу данных
                const insertUserQuery = 'INSERT INTO users (login, email, password, verificationCode) VALUES (?, ?, ?, ?)';
                db.query(insertUserQuery, [login, email, hashedPassword, hashedVerificationCode], (err) => {
                    if (err) {
                        console.error('Ошибка при добавлении пользователя:', err);
                        return res.status(500).send('Ошибка при добавлении пользователя');
                    }

                    // Отправка письма с кодом подтверждения
                    const mailOptions = {
                        from: process.env.EMAIL_USER, // Отправитель
                        to: email, // Получатель
                        subject: 'Код подтверждения', // Тема письма
                        text: `Ваш код подтверждения: ${verificationCode}`, // Текст письма
                        html: `<p>Ваш код подтверждения: <strong>${verificationCode}</strong></p>` // HTML-версия письма
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error('Ошибка при отправке письма:', err);
                            return res.status(500).send('Ошибка при отправке письма');
                        }
                        console.log('Письмо отправлено:', info.response);
                        res.status(201).send('Код подтверждения отправлен на вашу почту');
                    });
                });
            });
        });
    });
});

// Роут для проверки кода подтверждения
router.post('/verify-code', (req, res) => {
    const { email, code } = req.body;

    // Поиск пользователя по email
    const verifyUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(verifyUserQuery, [email], (err, results) => {
        if (err) {
            console.error('Ошибка при проверке кода:', err);
            return res.status(500).send('Ошибка при проверке кода');
        }

        if (results.length === 0) {
            return res.status(400).send('Пользователь с такой почтой не найден');
        }

        const user = results[0];

        // Сравнение хэшированного кода
        bcrypt.compare(code, user.verificationCode, (err, isMatch) => {
            if (err) {
                console.error('Ошибка при сравнении кода:', err);
                return res.status(500).send('Ошибка при проверке кода');
            }

            if (!isMatch) {
                return res.status(400).send('Неверный код подтверждения');
            }

            // Обновление статуса пользователя
            const updateUserQuery = 'UPDATE users SET isVerified = TRUE, verificationCode = NULL WHERE email = ?';
            db.query(updateUserQuery, [email], (err) => {
                if (err) {
                    console.error('Ошибка при подтверждении почты:', err);
                    return res.status(500).send('Ошибка при подтверждении почты');
                }
                res.status(200).send('Почта успешно подтверждена');
            });
        });
    });
});

// Роут для отправки кода подтверждения
router.post('/send-code', (req, res) => {
    const { email } = req.body;

    console.log('Получен запрос на отправку кода для почты:', email); // Логируем входящие данные

    if (!email) {
        console.log('Ошибка: Почта обязательна');
        return res.status(400).send('Почта обязательна');
    }

    // Генерация кода подтверждения
    const verificationCode = generateVerificationCode();
    console.log('Сгенерирован код подтверждения:', verificationCode);

    // Хеширование кода подтверждения
    bcrypt.hash(verificationCode, saltRounds, (err, hashedVerificationCode) => {
        if (err) {
            console.error('Ошибка при хешировании кода подтверждения:', err);
            return res.status(500).send('Ошибка при хешировании кода подтверждения');
        }

        // Сохранение хэшированного кода в базе данных
        const updateCodeQuery = 'UPDATE users SET verificationCode = ? WHERE email = ?';
        db.query(updateCodeQuery, [hashedVerificationCode, email], (err) => {
            if (err) {
                console.error('Ошибка при обновлении кода:', err);
                return res.status(500).send('Ошибка при обновлении кода');
            }

            console.log('Код подтверждения сохранен в базе данных');

            // Отправка письма с кодом подтверждения
            const mailOptions = {
                from: process.env.EMAIL_USER, // Отправитель
                to: email, // Получатель
                subject: 'Код подтверждения', // Тема письма
                text: `Ваш код подтверждения: ${verificationCode}`, // Текст письма
                html: `<p>Ваш код подтверждения: <strong>${verificationCode}</strong></p>` // HTML-версия письма
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Ошибка при отправке письма:', err);
                    return res.status(500).send('Ошибка при отправке письма');
                }
                console.log('Письмо отправлено:', info.response);
                res.status(200).send('Код подтверждения отправлен на вашу почту');
            });
        });
    });
});

module.exports = router; // Экспортируем роутер для использования в других частях приложения
