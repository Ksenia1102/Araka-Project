const ProfileService = require('../services/ProfileService');
const bcrypt = require('bcrypt');

class ProfileController {
    // Получение профиля
    static async getProfile(req, res, next) {
        try {
            const user = await ProfileService.getUser(req.params.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (err) {
            next(err);
        }
    }

    // Обновление профиля (имя, фамилия, логин, пароль)
    static async updateProfile(req, res, next) {
        try {
            const { userId } = req.params;
            const { name, surname, login, password } = req.body;

            // Хешируем пароль, если он передан
            const updates = { name, surname, login };
            if (password) {
                updates.password = await bcrypt.hash(password, 10);
            }

            await ProfileService.updateUser(userId, updates);
            res.status(200).json({ message: 'Profile updated successfully' });
        } catch (err) {
            next(err);
        }
    }

    // Удаление профиля (с каскадным удалением связанных данных)
    static async deleteProfile(req, res, next) {
        try {
            const { userId } = req.params;
            await ProfileService.deleteUser(userId);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ProfileController;
