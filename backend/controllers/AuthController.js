const AuthService = require('../services/AuthService');

class AuthController {
    static async register(req, res, next) {
        try {
            const { login, password } = req.body;
            const user = await AuthService.register(login, password);
            res.status(201).json({ id: user.id, login: user.login });
        } catch (err) {
            next(err); // Передаем ошибку в errorHandler
        }
    }

    static async login(req, res, next) {
        try {
            const { login, password } = req.body;
            const token = await AuthService.login(login, password);
            res.json({ token });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuthController;
