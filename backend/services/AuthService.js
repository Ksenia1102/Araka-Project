const bcrypt = require('bcrypt');
const { Op } = require('sequelize'); // Добавляем импорт Op
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User } = require('../models'); // Используем модель Sequelize
require('dotenv').config();

class AuthService {
    // Генерация 6-значного кода
    static generateVerificationCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    // Настройка почтового клиента
    static getTransporter() {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    static validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Пароль должен содержать минимум 8 символов');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну цифру');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну строчную букву');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну заглавную букву');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    static async register(login, email, password) {
        try {
            if (!password) throw new Error('Пароль обязателен');
            
            // Проверка сложности пароля
            this.validatePassword(password);
    
            // Проверяем, не занят ли email или логин
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [{ login }, { email }]
                }
            });
            
            if (existingUser) throw new Error('Пользователь с таким логином или email уже существует');
    
            // Генерируем код и хешируем его
            const verificationCode = this.generateVerificationCode();
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const hashedCode = await bcrypt.hash(verificationCode, salt);
    
            // Создаём пользователя
            const user = await User.create({
                login,
                email,
                password: hashedPassword,
                verificationCode: hashedCode,
                isVerified: false
            });
    
            // Отправляем письмо с кодом
            const transporter = this.getTransporter();
            await transporter.sendMail({
                from: `"Ваш сервис" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Код подтверждения регистрации',
                html: `
                    <h2>Добро пожаловать!</h2>
                    <p>Ваш код подтверждения: <strong>${verificationCode}</strong></p>
                    <p>Используйте его для активации аккаунта.</p>
                `
            });
    
            return user;
        } catch (error) {
            console.error('Ошибка при регистрации:', error.message);
            throw new Error(`Ошибка при регистрации: ${error.message}`);
        }
    }
    // Вход пользователя
    static async login(loginOrEmail, password) {
        const isEmail = loginOrEmail.includes('@');
        const whereCondition = isEmail ? { email: loginOrEmail } : { login: loginOrEmail };
    
        const user = await User.findOne({ where: whereCondition });
        if (!user) throw new Error('Пользователь не найден');
        if (!user.isVerified) throw new Error('Почта не подтверждена. Пожалуйста, проверьте ваш email.');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error('Неверный пароль');
    
        const token = jwt.sign({ id: user.id, login: user.login }, process.env.JWT_SECRET_KEY, { expiresIn: '10h' });
    
        return { token, user: { id: user.id, login: user.login } };
    }

    // Восстановление пароля (аналогично, но через модель)
    static async requestPasswordReset(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error('Пользователь не найден');

        const resetCode = this.generateVerificationCode();
        const hashedResetCode = await bcrypt.hash(resetCode, 10);

        await user.update({ resetCode: hashedResetCode });

        const transporter = this.getTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Код сброса пароля',
            html: `<p>Ваш код: <strong>${resetCode}</strong></p>`
        });

        return { message: 'Код отправлен на почту' };
    }
    static async sendVerificationCode(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Пользователь с таким email не найден');
        }

        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        const hashedCode = await bcrypt.hash(code, 10);

        await user.update({ verificationCode: hashedCode });

        // Отправка письма (настройте transporter как в предыдущих примерах)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Код подтверждения',
            html: `<p>Ваш код: <strong>${code}</strong></p>`
        });

        return { message: 'Код отправлен на почту' };
    }
    static async verifyRegistrationCode(email, code) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error('Пользователь не найден');

        // Проверяем код
        if (!user.verificationCode) throw new Error('Код подтверждения не был отправлен');

        const isCodeValid = await bcrypt.compare(code, user.verificationCode);
        if (!isCodeValid) throw new Error('Неверный код подтверждения');

        // Активируем аккаунт и очищаем код
        await user.update({
            isVerified: true,
            verificationCode: null
        });

        return { success: true, message: 'Email успешно подтверждён' };
    }

    static async verifyResetCode(email, code) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error('Пользователь не найден');

        if (!user.resetCode) throw new Error('Код сброса не был отправлен');

        const isCodeValid = await bcrypt.compare(code, user.resetCode);
        if (!isCodeValid) throw new Error('Неверный код подтверждения');

        return { success: true };
    }

    static async resetPassword(email, newPassword) {
        // Проверка сложности нового пароля
        if (!this.validatePassword(newPassword)) {
            throw new Error('Пароль должен содержать минимум 8 символов, включая цифры, заглавные и строчные буквы');
        }
    
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error('Пользователь не найден');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({
            password: hashedPassword,
            resetCode: null // Очищаем код после смены пароля
        });

        return { success: true, message: 'Пароль успешно обновлён' };
    }
}

module.exports = AuthService;
