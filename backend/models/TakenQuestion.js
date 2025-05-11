const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TakenQuestion = sequelize.define(
    'TakenQuestion',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        taken_survey_id: { type: DataTypes.INTEGER, allowNull: false },
        question_id: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
        tableName: 'taken_questions',
        timestamps: false,
        underscored: true
    }
);

module.exports = TakenQuestion;
