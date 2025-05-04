const { User } = require('../models');
const bcrypt = require('bcrypt');

class ProfileService {
    static async getUser(userId) {
        return await User.findByPk(userId, {
            attributes: ['id', 'name', 'surname', 'login', 'email'] // Добавляем email
        });
    }

<<<<<<< HEAD
    static async updateUser(userId, { name, surname, login, password, email }) {
        // Добавляем email
=======
    static async updateUser(userId, { name, surname, login, password, email }) { // Добавляем email
>>>>>>> ee5b91bd657e07c78d961e8fe43950aa17f8b4b5
        const updates = {};
        if (name) updates.name = name;
        if (surname) updates.surname = surname;
        if (login) updates.login = login;
        if (email) updates.email = email; // Добавляем обновление email
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        await User.update(updates, { where: { id: userId } });
    }
    static async checkEmailExists(email) {
        return await User.findOne({ where: { email } });
    }

    static async checkEmailExists(email) {
        return await User.findOne({ where: { email } });
    }

    static async deleteUser(userId) {
        await User.destroy({ where: { id: userId } });
    }
}

module.exports = ProfileService;