const express = require('express');
const cors = require('cors'); // Подключаем модуль CORS
const path = require('path');

const app = require('./app');

// Настройка CORS
app.use(
    cors({
        origin: [
            // Локальный фронтенд на Vite
            'http://localhost:5173' // Альтернативный вариант для локального хоста,
        ], // Разрешаем несколько источников
        methods: 'GET,POST,PUT,DELETE', // Разрешаем методы
        allowedHeaders: 'Content-Type, Authorization, token' // Разрешаем заголовкиэ
    })
);

// Остальные middleware и маршруты
app.use(express.json());
// Например: app.use('/api/auth', require('./routes/auth'));

// // Обслуживание статических файлов фронтенда
// app.use(express.static(path.join(__dirname, '../dist')));
// console.log('Serving static files from:', path.join(__dirname, '../dist'));

// Прокси для API-запросов (например, если у вас есть API)
app.get('/api', (req, res) => {
    res.json({ message: 'API работает!' });
});

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

const PORT = process.env.APP_PORT || 3000; // Используйте переменные окружения для гибкости
const HOST = process.env.APP_HOST || '0.0.0.0'; // Прослушивание на всех интерфейсах

console.log(`Server is running on http://${'0.0.0.0'}:${PORT}`);

// app.listen(PORT, HOST, () => {
//     console.log(`Server running on http://${HOST}:${PORT}`);
// });
