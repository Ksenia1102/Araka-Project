const express = require('express');
const cors = require('cors'); // Подключаем модуль CORS

const app = express();

// Настройка CORS
app.use(
    cors({
        origin: 'http://localhost:5173' // Укажите порт, где работает Vite
    })
);

// Остальные middleware и маршруты
app.use(express.json());
// Например: app.use('/api/auth', require('./routes/auth'));

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
