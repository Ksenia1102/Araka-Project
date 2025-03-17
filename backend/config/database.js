const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    logging: false // Выключаем логи
});

async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('✅ Успешное подключение к базе данных');
    } catch (error) {
        console.error('❌ Ошибка подключения:', error);
    }
}

module.exports = { sequelize, connectDB }; // Экспортируем sequelize
