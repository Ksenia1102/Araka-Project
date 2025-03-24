const request = require('supertest');
const app = require('../app'); // Импортируйте ваше Express-приложение
const { User } = require('../models'); // Импортируйте модель User
const { sequelize } = require('../config/database'); // Импортируйте sequelize

describe('AuthController', () => {
    beforeAll(async () => {
        // Синхронизация базы данных (очистка и создание таблиц)
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        // Закрытие соединения с базой данных
        await sequelize.close();
    });

    it('should register a new user', async () => {
        const res = await request(app).post('/auth/register').send({ login: 'test@example.com', password: '123456', name: 'Test', surname: 'User' }).expect(201);

        expect(res.body.message).toBe('Пользователь зарегистрирован');
        expect(res.body.user.login).toBe('test@example.com');
    });

    it('should not register a user with existing login', async () => {
        // Сначала регистрируем пользователя
        await request(app).post('/auth/register').send({ login: 'test@example.com', password: '123456', name: 'Test', surname: 'User' });

        // Пытаемся зарегистрировать пользователя с тем же логином
        const res = await request(app).post('/auth/register').send({ login: 'test@example.com', password: '123456', name: 'Test', surname: 'User' }).expect(400);

        expect(res.body.message).toBe('Пользователь с таким логином уже существует');
    });

    it('should login a user', async () => {
        // Сначала регистрируем пользователя
        await request(app).post('/auth/register').send({ login: 'test@example.com', password: '123456', name: 'Test', surname: 'User' });

        // Логинимся
        const res = await request(app).post('/auth/login').send({ login: 'test@example.com', password: '123456' }).expect(200);

        expect(res.body.message).toBe('Успешный вход');
        expect(res.body.token).toBeDefined();
    });

    it('should not login with invalid password', async () => {
        // Сначала регистрируем пользователя
        await request(app).post('/auth/register').send({ login: 'test@example.com', password: '123456', name: 'Test', surname: 'User' });

        // Логинимся с неверным паролем
        const res = await request(app).post('/auth/login').send({ login: 'test@example.com', password: 'wrong-password' }).expect(401);

        expect(res.body.message).toBe('Неверный пароль');
    });

    it('should not login with non-existing user', async () => {
        // Логинимся с несуществующим пользователем
        const res = await request(app).post('/auth/login').send({ login: 'nonexisting@example.com', password: '123456' }).expect(404);

        expect(res.body.message).toBe('Пользователь не найден');
    });
});
