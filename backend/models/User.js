const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Правильный импорт sequelize
// const bcrypt = require('bcrypt');

const User = sequelize.define(
    'User',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        login: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.TEXT },
        surname: { type: DataTypes.TEXT },
        email: { type: DataTypes.STRING(255), allowNull: false },
        isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        verificationCode: { type: DataTypes.STRING(255), allowNull: true },
        resetCode: { type: DataTypes.STRING(255), allowNull: true }
    },
    {
        tableName: 'users',
        timestamps: false
        // hooks: {
        //     beforeCreate: async (user) => {
        //         user.password = await bcrypt.hash(user.password, 10);
        //     }
        // }
    }
);

module.exports = User; // Экспортируем модель User
