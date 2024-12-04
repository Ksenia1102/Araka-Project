const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

// Создание пула соединений
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'eduvision_db' // Название базы данных
});

// Вспомогательная функция для выполнения SQL-запросов
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

// Маршрут для создания класса
router.post('/create-class', async (req, res) => {
    const { user_id, title } = req.body;

    // Проверка данных
    if (!user_id || !title) {
        return res.status(400).json({ error: 'Некорректные данные (проверьте user_id, title)' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            // Начало транзакции
            await queryAsync(connection, 'START TRANSACTION');

            // Сохранение класса
            const classInsertQuery = 'INSERT INTO class (user_id, title) VALUES (?, ?)';
            const result = await queryAsync(connection, classInsertQuery, [user_id, title]);
            const classId = result.insertId;

            // Завершение транзакции
            await queryAsync(connection, 'COMMIT');
            res.status(200).json({ message: 'Класс успешно добавлен', classId });
        } catch (error) {
            console.error('Ошибка выполнения запроса:', error);
            await queryAsync(connection, 'ROLLBACK'); // Откат транзакции
            res.status(500).json({ error: 'Ошибка при добавлении данных' });
        } finally {
            connection.release();
        }
    });
});

module.exports = router;
