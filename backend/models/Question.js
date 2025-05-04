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
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        file_url: { type: DataTypes.TEXT, allowNull: true },
        file_folder: { type: DataTypes.TEXT, allowNull: true }, // images / videos / audio / others
        file_name: { type: DataTypes.TEXT, allowNull: true }, // имя файла с расширением
        file_type: { type: DataTypes.TEXT, allowNull: true } // image / video / audio / other (для удобства фронта) // Новое поле для хранения URL файла
    },
    {
        tableName: 'questions', // Имя таблицы в БД
        timestamps: false // База данных уже управляет временными метками
    }
);

module.exports = Question;
