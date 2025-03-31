const AuthService = require('../services/AuthService');

class AuthController {
    // Регистрация
    static async register(req, res, next) {
        try {
            const { login, email, password } = req.body;
            const user = await AuthService.register(login, email, password);
            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    // Вход
    static async login(req, res, next) {
        try {
            const { loginOrEmail, password } = req.body;
            const { token, user } = await AuthService.login(loginOrEmail, password);
            res.json({ token, user });
        } catch (err) {
            next(err);
        }
    }

    // Запрос сброса пароля
    static async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            const result = await AuthService.requestPasswordReset(email);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
    static async sendVerificationCode(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email обязателен' });
            }

            const result = await AuthService.sendVerificationCode(email);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async verifyRegistrationCode(req, res, next) {
        try {
            const { email, code } = req.body;
            const result = await AuthService.verifyRegistrationCode(email, code);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
    static async verifyResetCode(req, res, next) {
        try {
            const { email, code } = req.body;
            const result = await AuthService.verifyResetCode(email, code);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async resetPassword(req, res, next) {
        try {
            const { email, newPassword } = req.body;
            const result = await AuthService.resetPassword(email, newPassword);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuthController;
