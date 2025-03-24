const { User } = require('../models');
const bcrypt = require('bcrypt'); // Добавляем импорт bcrypt

class ProfileService {
    static async getUser(userId) {
        return await User.findByPk(userId, {
            attributes: ['id', 'name', 'surname', 'login'] // Не возвращаем пароль!
        });
    }

    static async updateUser(userId, { name, surname, login, password }) {
        const updates = {};
        if (name) updates.name = name;
        if (surname) updates.surname = surname;
        if (login) updates.login = login;
        if (password) {
            // Хешируем пароль перед сохранением
            updates.password = await bcrypt.hash(password, 10);
        }

        await User.update(updates, { where: { id: userId } });
    }

    static async deleteUser(userId) {
        // Каскадное удаление настроено в моделях (onDelete: 'CASCADE')
        await User.destroy({ where: { id: userId } });
    }
}

module.exports = ProfileService;
