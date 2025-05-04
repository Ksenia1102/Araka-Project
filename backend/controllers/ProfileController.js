const ProfileService = require('../services/ProfileService');
// const bcrypt = require('bcrypt');

class ProfileController {
    // Получение профиля
    static async getProfile(req, res, next) {
        try {
            const user = await ProfileService.getUser(req.params.userId, {
                attributes: ['id', 'name', 'surname', 'login', 'email', 'createdAt']
            });
<<<<<<< HEAD

>>>>>>> ee5b91bd657e07c78d961e8fe43950aa17f8b4b5
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (err) {
            next(err);
        }
    }

    // Обновление профиля (включая email)
    static async updateProfile(req, res, next) {
        try {
            const { userId } = req.params;
            const { name, surname, login, password, email } = req.body;

            const updates = { name, surname, login, email };

            if (password) {
                updates.password = await bcrypt.hash(password, 10);
            }

            // Проверка уникальности email, если он изменяется
            if (email) {
                const user = await ProfileService.getUser(userId);
                if (user.email !== email) {
                    const emailExists = await ProfileService.checkEmailExists(email);
                    if (emailExists) {
                        return res.status(400).json({ error: 'Email already in use' });
                    }
                }
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
