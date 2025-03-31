const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt'); // Для проверки пароля

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
const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Маршрут для получения данных пользователя
router.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Получаем данные пользователя из базы данных
        const query = `SELECT name, surname, login FROM users WHERE id = ?`;
        const result = await queryAsync(query, [userId]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result[0];
        console.log(user.name);
        // Возвращаем данные пользователя, включая имя и фамилию, если они пустые, то возвращаем пустые строки
        res.status(200).json({
            username: user.name,
            lastname: user.surname || '', // Если фамилия пустая, возвращаем пустую строку
            login: user.login
        });
    } catch (error) {
        console.error('Error retrieving user data:', error);
        res.status(500).json({ error: 'Failed to retrieve user data' });
    }
});

router.put('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, lastname } = req.body;
    try {
        await db.query('UPDATE users SET name = ?, surname = ? WHERE id = ?', [name, lastname, userId]);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.put('/profile_auth/:userId', async (req, res) => {
    const { userId } = req.params;
    const { login, password } = req.body;

    try {
        // Начальная часть запроса для обновления
        let updateQuery = 'UPDATE users SET ';
        let updateValues = [];
        let fieldsToUpdate = [];

        // Добавляем изменения для логина
        if (login) {
            fieldsToUpdate.push('login = ?');
            updateValues.push(login);
        }

        // Добавляем изменения для пароля (если он есть)
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10); // Хешируем новый пароль
            fieldsToUpdate.push('password = ?');
            updateValues.push(hashedPassword);
        }

        // Если есть изменения, строим запрос
        if (fieldsToUpdate.length > 0) {
            updateQuery += fieldsToUpdate.join(', ') + ' WHERE id = ?';
            updateValues.push(userId);

            // Выполняем запрос
            await queryAsync(updateQuery, updateValues);
            res.status(200).json({ message: 'User updated successfully' });
        } else {
            res.status(400).json({ error: 'No data provided for update' });
        }
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.delete('/profile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Удаляем всех студентов, связанные с классами пользователя
        const deleteStudentsQuery = 'DELETE FROM student WHERE class_id IN (SELECT id FROM class WHERE user_id = ?)';
        await queryAsync(deleteStudentsQuery, [userId]);

        // 2. Удаляем все классы, связанные с этим пользователем
        const deleteClassesQuery = 'DELETE FROM class WHERE user_id = ?';
        await queryAsync(deleteClassesQuery, [userId]);

        // 3. Удаляем опции, связанные с вопросами этого пользователя
        const deleteOptionsQuery = 'DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE survey_id IN (SELECT id FROM surveys WHERE user_id = ?))';
        await queryAsync(deleteOptionsQuery, [userId]);

        // 4. Удаляем вопросы, связанные с этим пользователем
        const deleteQuestionsQuery = 'DELETE FROM questions WHERE survey_id IN (SELECT id FROM surveys WHERE user_id = ?)';
        await queryAsync(deleteQuestionsQuery, [userId]);

        // 5. Удаляем анкеты этого пользователя
        const deleteSurveysQuery = 'DELETE FROM surveys WHERE user_id = ?';
        await queryAsync(deleteSurveysQuery, [userId]);

        // 6. Удаляем самого пользователя
        const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
        const result = await queryAsync(deleteUserQuery, [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User and related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting user and related data:', error);
        res.status(500).json({ error: 'Failed to delete user and related data' });
    }
});

module.exports = router;
