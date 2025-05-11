const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TakenSurvey = sequelize.define(
    'TakenSurvey',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        survey_id: { type: DataTypes.INTEGER, allowNull: false }, // survey_id
        class_id: { type: DataTypes.INTEGER, allowNull: false },
        date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
        tableName: 'taken_surveys', // явно указываем имя таблицы
        timestamps: false
    }
);
module.exports = TakenSurvey;
