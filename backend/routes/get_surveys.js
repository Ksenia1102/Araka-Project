const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');

// Подключаем .env файл
dotenv.config({ path: '../backend/.env' });

// Создаем подключение к базе данных
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Утилита для выполнения запросов с использованием Promises
const queryAsync = (connection, query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Маршрут для получения опросов пользователя по его ID
router.get('/surveys1/user/:user_id', async (req, res) => {
    const { user_id } = req.params; // Получаем user_id из параметров URL

    if (!user_id) {
        return res.status(400).json({ error: 'user_id обязателен' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            // Запрос для получения всех опросов пользователя
            const surveys = await queryAsync(connection, 'SELECT * FROM surveys WHERE user_id = ?', [user_id]);

            if (surveys.length === 0) {
                return res.status(404).json({ message: 'Нет опросов для этого пользователя' });
            }

            connection.release();
            res.status(200).json(surveys); // Отправляем найденные опросы
        } catch (error) {
            console.error('Ошибка при получении опросов:', error);
            connection.release();
            res.status(500).json({ error: 'Ошибка при получении опросов' });
        }
    });
});

module.exports = router;
