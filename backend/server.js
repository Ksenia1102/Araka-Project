require('dotenv').config();
const path = require('path');
const express = require('express');
const { createServer } = require('http');
const { connectDB } = require('./config/database');
const cors = require('cors');

// Импорт основного приложения и WebSocket
const backendApp = require('./app');
const { setupWebSocket, sendToUser } = require('./index');

const FRONTEND_DIR = path.join(__dirname, '../dist');
const PORT = process.env.APP_PORT || 59523;
const HOST = process.env.APP_IP || '0.0.0.0';

const app = express();
const server = createServer(app);

// Улучшенная настройка CORS с динамическими origin
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = ['http://localhost:5173', 'http://localhost:59523', 'http://eduvision.na4u.ru', 'https://eduvision.na4u.ru'];

        // Разрешить запросы без origin (например, из Postman)
        if (!origin) return callback(null, true);

        if (
            allowedOrigins.includes(origin) ||
            origin.startsWith('http://localhost:') || // Разрешаем все локальные порты
            origin.endsWith('.na4u.ru')
        ) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
};

// Применяем CORS ко всем роутам
app.use(cors(corsOptions));

// Обработка OPTIONS-запросов
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://eduvision.na4u.ru'); // Разрешённый домен
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Методы
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token'); // Разрешённые заголовки
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Для работы с cookies
    res.sendStatus(204); // Успешный ответ для preflight
});

// Парсинг тела запроса ДО основных роутов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование входящих запросов (для отладки CORS)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
    next();
});

// Подключение WebSocket
setupWebSocket(server);

// Подключение бэкенд-роутов
app.use('/api', backendApp);

// Раздача статики фронтенда
app.use(
    express.static(FRONTEND_DIR, {
        maxAge: '1y',
        etag: true
    })
);

// SPA роутинг
app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Специальная обработка CORS ошибок
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: err.message
        });
    }

    res.status(500).send('Server Error');
});
app.set('sendToUser', sendToUser);

// Запуск сервера
server.listen(PORT, HOST, async () => {
    console.log(`🚀 Сервер запущен на http://${HOST}:${PORT}`);
    console.log('Разрешённые origins:', corsOptions.origin);
    await connectDB();
});
