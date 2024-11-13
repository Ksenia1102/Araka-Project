// Импортируем модуль express для создания сервера
const express = require('express');

// Импортируем bodyParser для обработки JSON-данных из тела запросов
const bodyParser = require('body-parser');

// Импортируем dotenv для работы с переменными окружения
const dotenv = require('dotenv');

// Импортируем маршруты для обработки регистрации
const registrationRoutes = require('./routes/registration');

const cors = require('cors'); // Импортируем CORS для обеспечения кросс-доменных запросов

// Загрузка переменных окружения из файла .env
dotenv.config({ path: '../backend/.env' });

const app = express(); // Создаем экземпляр express-приложения
app.use(bodyParser.json()); // Настраиваем обработку запросов с телом в формате JSON
app.use(cors()); // Включаем CORS для разрешения запросов с других доменов

// app.get('/', (req, res) => {
//     res.send('<h1>Home page</h1>');
// });

// Подключаем маршруты для обработки запросов по пути /registration
app.use('/registration', registrationRoutes);

// Запуск сервера на порту 3000
app.listen(3000, () => {
    console.log('SERVER START'); // Логирование успешного запуска сервера
});
