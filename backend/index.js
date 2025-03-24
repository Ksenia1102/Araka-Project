// const express = require('express');
// const cors = require('cors'); // Подключаем модуль CORS
// const path = require('path');

// const app = require('./app');

// // Настройка CORS
// app.use(
//     cors({
//         origin: [
//             // Локальный фронтенд на Vite
//             'http://localhost:5173' // Альтернативный вариант для локального хоста,
//         ], // Разрешаем несколько источников
//         methods: 'GET,POST,PUT,DELETE', // Разрешаем методы
//         allowedHeaders: 'Content-Type, Authorization, token' // Разрешаем заголовкиэ
//     })
// );

// // Остальные middleware и маршруты
// app.use(express.json());
// Например: app.use('/api/auth', require('./routes/auth'));

// // Обслуживание статических файлов фронтенда
// app.use(express.static(path.join(__dirname, '../dist')));
// console.log('Serving static files from:', path.join(__dirname, '../dist'));

// Отправка index.html для всех других запросов
// Это нужно для маршрутизации фронтенда, чтобы приложение Vue/Vite работало
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../dist', 'index.html'));
// });

// // Запуск сервера
// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// index.js
require('dotenv').config(); // Загружаем переменные окружения
const { connectDB } = require('./config/database'); // Подключаем БД
const app = require('./app'); // Импортируем основное приложение

const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || '0.0.0.0';

app.listen(PORT, async () => {
    console.log(`🚀 Сервер запущен на http://${HOST}:${PORT}`);
    await connectDB();
});
