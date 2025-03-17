// /src/models/Student.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define(
    'Student',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        class_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.TEXT, allowNull: false },
        aruco_num: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
        tableName: 'student', // Имя таблицы в БД
        timestamps: false // Временные метки не используются
    }
);

module.exports = Student;
