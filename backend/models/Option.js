// /src/models/Option.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Option = sequelize.define(
    'Option',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        question_id: { type: DataTypes.INTEGER, allowNull: false },
        text: { type: DataTypes.TEXT, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
        tableName: 'options', // Имя таблицы в БД
        timestamps: false // База данных уже управляет временными метками
    }
);

module.exports = Option;
