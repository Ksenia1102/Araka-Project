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

// Маршрут для сохранения студентов
router.post('/save-students', async (req, res) => {
    const { class_id, students } = req.body;

    if (!class_id || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Некорректные данные: требуется class_id и список студентов' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            // Начало транзакции
            await queryAsync(connection, 'START TRANSACTION');

            const studentInsertQuery = 'INSERT INTO student (id, class_id, name) VALUES (?, ?, ?)';
            for (let i = 1; i <= students.length; i++) {
                console.log(students[i - 1]);
                await queryAsync(connection, studentInsertQuery, [i, class_id, students[i - 1].name]);
            }

            // Завершение транзакции
            await queryAsync(connection, 'COMMIT');
            res.status(200).json({ message: 'Студенты успешно добавлены' });
        } catch (error) {
            console.error('Ошибка выполнения запроса:', error);
            await queryAsync(connection, 'ROLLBACK'); // Откат транзакции
            res.status(500).json({ error: 'Ошибка при добавлении данных' });
        } finally {
            connection.release();
        }
    });
});
// Маршрут для получения списка студентов по ID класса
router.get('/get-students/:classId', async (req, res) => {
    const { classId } = req.params;

    if (!classId) {
        return res.status(400).json({ error: 'classId не указан' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            const studentsQuery = 'SELECT id, name FROM student WHERE class_id = ?';
            const students = await queryAsync(connection, studentsQuery, [classId]);
            res.status(200).json(students);
        } catch (error) {
            console.error('Ошибка выполнения запроса:', error);
            res.status(500).json({ error: 'Ошибка при получении данных' });
        } finally {
            connection.release();
        }
    });
});
// Маршрут для удаления студента
router.delete('/delete-student/:classId/:studentId', async (req, res) => {
    const { classId, studentId } = req.params;

    if (!classId || !studentId) {
        return res.status(400).json({ error: 'Не указан classId или studentId' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            const deleteQuery = 'DELETE FROM student WHERE id = ? AND class_id = ?';
            const result = await queryAsync(connection, deleteQuery, [studentId, classId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Студент не найден' });
            }

            res.status(200).json({ message: 'Студент успешно удалён' });
        } catch (error) {
            console.error('Ошибка выполнения запроса:', error);
            res.status(500).json({ error: 'Ошибка при удалении студента' });
        } finally {
            connection.release();
        }
    });
});
module.exports = router;
