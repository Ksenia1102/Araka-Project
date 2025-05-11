const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TakenQuestionAnswer = sequelize.define(
    'TakenQuestionAnswer',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        taken_question_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        answer: { type: DataTypes.INTEGER, allowNull: false },
        date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
        tableName: 'taken_question_answers',
        timestamps: false,
        underscored: true
    }
);

module.exports = TakenQuestionAnswer;
