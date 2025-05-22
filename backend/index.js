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
require('dotenv').config();
const { connectDB } = require('./config/database');
const app = require('./app');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (ws) => {
    console.log('🟢 Новый WebSocket клиент подключён');
    clients.add(ws);
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);

            if (message.type === 'auth') {
                const decoded = jwt.verify(message.token, process.env.JWT_SECRET_KEY);
                ws.userId = decoded.id;
                console.log('[WS] Пользователь авторизован по WS:', ws.userId);
                clients.add(ws);
            }
            if (message.type === 'get_current_state') {
                if (!ws.userId) return;

                const { TakenSurvey, Survey, Class } = require('./models'); // Убедись, что путь к моделям правильный

                const active = await TakenSurvey.findOne({
                    where: { is_active: true },
                    include: [
                        { model: Survey, as: 'survey' },
                        { model: Class, as: 'class' }
                    ]
                });

                if (active) {
                    ws.send(
                        JSON.stringify({
                            type: 'session_started',
                            frontendData: {
                                active: true,
                                title: active.survey?.title,
                                class_name: active.class?.title,
                                taken_survey_id: active.id
                                // Добавь сюда любые другие поля по желанию
                            }
                        })
                    );
                }
            }

            // TODO: обработка других типов сообщений
        } catch (e) {
            console.error('[WS] Ошибка обработки сообщения:', e.message);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`🔴 Клиент отключился (userId=${ws.userId}) Код: ${code}, Причина: ${reason.toString()}`);
        clients.delete(ws);
    });
});

const pingInterval = setInterval(() => {
    for (const ws of clients) {
        if (!ws.isAlive) {
            console.log(`Закрываем неактивное соединение userId=${ws.userId}`);
            clients.delete(ws);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    }
}, 30000);

wss.on('close', () => clearInterval(pingInterval));

function sendToUser(userId, message) {
    const jsonData = JSON.stringify(message);
    let found = false;

    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN && client.userId === userId) {
            client.send(jsonData);
            found = true;
        }
    }

    if (!found) {
        console.warn('No active WS client found for userId:', userId);
    }
}

app.set('sendToUser', sendToUser);

const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
    console.log(`🚀 Сервер запущен на http://${HOST}:${PORT}`);
    await connectDB();
});
