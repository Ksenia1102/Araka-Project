// /src/models/Survey.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Survey = sequelize.define(
    'Survey',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
        tableName: 'surveys', // Имя таблицы в БД
        timestamps: false // База данных уже управляет временными метками
    }
);

module.exports = Survey;
