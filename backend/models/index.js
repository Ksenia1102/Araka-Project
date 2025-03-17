const sequelize = require('../config/database');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const Survey = require('./Survey');
const Question = require('./Question');
const Option = require('./Option');

// Устанавливаем связи
User.hasMany(Class, { foreignKey: 'user_id' });
Class.belongsTo(User, { foreignKey: 'user_id' });

Class.hasMany(Student, { foreignKey: 'class_id' });
Student.belongsTo(Class, { foreignKey: 'class_id' });

User.hasMany(Survey, { foreignKey: 'user_id' });
Survey.belongsTo(User, { foreignKey: 'user_id' });

Survey.hasMany(Question, { foreignKey: 'survey_id' });
Question.belongsTo(Survey, { foreignKey: 'survey_id' });

Question.hasMany(Option, { foreignKey: 'question_id' });
Option.belongsTo(Question, { foreignKey: 'question_id' });

Question.belongsTo(Option, { as: 'correctAnswer', foreignKey: 'correct_option' });

module.exports = { sequelize, User, Class, Student, Survey, Question, Option };
