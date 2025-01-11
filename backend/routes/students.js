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

// Исправленный маршрут для сохранения студентов
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

            // Получаем все существующие aruco_num для класса, отсортированные по возрастанию
            const getExistingArucoNumsQuery = 'SELECT aruco_num FROM student WHERE class_id = ? ORDER BY aruco_num ASC';
            const existingArucoNums = await queryAsync(connection, getExistingArucoNumsQuery, [class_id]);

            // Создаем множество занятых номеров
            const occupiedNums = new Set(existingArucoNums.map((row) => row.aruco_num));

            // Функция для нахождения наименьшего свободного номера
            const findSmallestFreeNum = () => {
                let num = 1;
                while (occupiedNums.has(num)) {
                    num++;
                }
                return num;
            };

            // Добавляем студентов с корректным aruco_num
            const studentInsertQuery = 'INSERT INTO student (class_id, name, aruco_num) VALUES (?, ?, ?)';
            for (let student of students) {
                const arucoNum = findSmallestFreeNum(); // Находим наименьший свободный номер
                occupiedNums.add(arucoNum); // Помечаем номер как занятый
                await queryAsync(connection, studentInsertQuery, [class_id, student.name, arucoNum]);
            }

            // Фиксируем изменения
            await queryAsync(connection, 'COMMIT');
            res.status(200).json({ message: 'Студенты успешно добавлены.' });
        } catch (err) {
            console.error('Ошибка при добавлении студентов:', err);
            await queryAsync(connection, 'ROLLBACK');
            res.status(500).json({ error: 'Ошибка при добавлении студентов.' });
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
            const studentsQuery = 'SELECT aruco_num, name FROM student WHERE class_id = ?';
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
router.delete('/delete-student/:classId/:arucoNum', async (req, res) => {
    const { classId, arucoNum } = req.params;

    if (!classId || !arucoNum) {
        return res.status(400).json({ error: 'Не указан classId или arucoNum' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка при подключении к базе данных' });
        }

        try {
            const deleteQuery = 'DELETE FROM student WHERE aruco_num = ? AND class_id = ?';
            const result = await queryAsync(connection, deleteQuery, [arucoNum, classId]);

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
router.get('/get-class-name/:classId', async (req, res) => {
    const { classId } = req.params;

    if (!classId) {
        return res.status(400).json({ error: 'classId не указан' });
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка подключения к базе данных' });
        }

        try {
            const query = 'SELECT name FROM class WHERE id = ?'; // Обновите название таблицы и поля
            const results = await queryAsync(connection, query, [classId]);

            if (results.length === 0) {
                return res.status(404).json({ error: 'Класс не найден' });
            }

            res.status(200).json({ className: results[0].name });
        } catch (error) {
            console.error('Ошибка выполнения запроса:', error);
            res.status(500).json({ error: 'Ошибка при получении данных' });
        } finally {
            connection.release();
        }
    });
});

module.exports = router;
