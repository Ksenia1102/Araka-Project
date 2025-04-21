const AuthService = require('../services/AuthService');

class AuthController {
    // Регистрация
    static async register(req, res, next) {
        try {
            const { login, email, password } = req.body;
            if (!login || !email || !password) {
                return res.status(400).json({ error: 'Все поля обязательны' });
            }
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
            if (!loginOrEmail || !password) {
                return res.status(400).json({ error: 'Логин/email и пароль обязательны' });
            }
            const { token, user } = await AuthService.login(loginOrEmail, password);
            res.json({ token, user });
        } catch (err) {
            next(err);
        }
    }

    // Отправка кода подтверждения
    static async sendVerificationCode(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ 
                    error: 'Email обязателен',
                    errorType: 'EMAIL_REQUIRED'
                });
            }

            const result = await AuthService.sendVerificationCode(email);
            res.json({
                success: true,
                message: 'Код подтверждения отправлен',
                ...result
            });
        } catch (err) {
            // Специфичная обработка ошибок для фронтенда
            if (err.message === 'EMAIL_ALREADY_EXISTS') {
                return res.status(400).json({
                    error: 'Почта уже занята',
                    errorType: 'EMAIL_ALREADY_EXISTS'
                });
            }
            next(err);
        }
    }

    // Подтверждение кода
    static async verifyRegistrationCode(req, res, next) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ 
                    error: 'Email и код обязательны',
                    errorType: 'VALIDATION_ERROR'
                });
            }

            const result = await AuthService.verifyRegistrationCode(email, code);
            res.json({
                success: true,
                message: 'Почта успешно подтверждена',
                ...result
            });
        } catch (err) {
            if (err.message === 'INVALID_CODE') {
                return res.status(400).json({
                    error: 'Неверный код подтверждения',
                    errorType: 'INVALID_CODE'
                });
            }
            if (err.message === 'CODE_EXPIRED') {
                return res.status(400).json({
                    error: 'Срок действия кода истек',
                    errorType: 'CODE_EXPIRED'
                });
            }
            next(err);
        }
    }

    // Запрос сброса пароля
    static async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email обязателен' });
            }
            const result = await AuthService.requestPasswordReset(email);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // Проверка кода сброса
    static async verifyResetCode(req, res, next) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Email и код обязательны' });
            }
            const result = await AuthService.verifyResetCode(email, code);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // Сброс пароля
    static async resetPassword(req, res, next) {
        try {
            const { email, newPassword } = req.body;
            if (!email || !newPassword) {
                return res.status(400).json({ error: 'Email и новый пароль обязательны' });
            }
            const result = await AuthService.resetPassword(email, newPassword);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuthController;