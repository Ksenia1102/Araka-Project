const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define(
    'Class',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.TEXT, allowNull: false }
    },
    {
        tableName: 'class',
        timestamps: false
    }
);

module.exports = Class;
