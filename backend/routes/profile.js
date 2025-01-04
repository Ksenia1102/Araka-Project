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

// Маршрут для удаления аккаунта пользователя
router.delete('/profile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Сначала удаляем все записи в таблице options, связанные с вопросами, которые принадлежат этому пользователю
        const deleteOptionsQuery = 'DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE survey_id IN (SELECT id FROM surveys WHERE user_id = ?))';
        await queryAsync(deleteOptionsQuery, [userId]);

        // Далее удаляем все вопросы, связанные с этим пользователем
        const deleteQuestionsQuery = 'DELETE FROM questions WHERE survey_id IN (SELECT id FROM surveys WHERE user_id = ?)';
        await queryAsync(deleteQuestionsQuery, [userId]);

        // Затем удаляем все анкеты, связанные с этим пользователем
        const deleteSurveysQuery = 'DELETE FROM surveys WHERE user_id = ?';
        await queryAsync(deleteSurveysQuery, [userId]);

        // Наконец, удаляем самого пользователя
        const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
        const result = await queryAsync(deleteUserQuery, [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
