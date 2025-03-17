// /src/models/Question.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define(
    'Question',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        survey_id: { type: DataTypes.INTEGER, allowNull: false },
        text: { type: DataTypes.TEXT, allowNull: false },
        correct_option: { type: DataTypes.INTEGER, defaultValue: null },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
        tableName: 'questions', // Имя таблицы в БД
        timestamps: false // База данных уже управляет временными метками
    }
);

module.exports = Question;
