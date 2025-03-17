const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Правильный импорт sequelize
const bcrypt = require('bcrypt');

const User = sequelize.define(
    'User',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        login: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.TEXT },
        surname: { type: DataTypes.TEXT }
    },
    {
        tableName: 'users',
        timestamps: false,
        hooks: {
            beforeCreate: async (user) => {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
);

module.exports = User; // Экспортируем модель User
