const sequelize = require('../config/database');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const Survey = require('./Survey');
const Question = require('./Question');
const Option = require('./Option');
const Folder = require('./Folder'); // Добавляем новую модель

// Устанавливаем связи
User.hasMany(Class, { foreignKey: 'user_id' });
Class.belongsTo(User, { foreignKey: 'user_id' });

Class.hasMany(Student, { foreignKey: 'class_id' });
Student.belongsTo(Class, { foreignKey: 'class_id' });

User.hasMany(Survey, { foreignKey: 'user_id' });
Survey.belongsTo(User, { foreignKey: 'user_id' });

// Добавляем связи для папок
User.hasMany(Folder, { foreignKey: 'user_id' });
Folder.belongsTo(User, { foreignKey: 'user_id' });

Folder.hasMany(Survey, {
    foreignKey: 'folder_id',
    as: 'surveys'
});
Survey.belongsTo(Folder, {
    foreignKey: 'folder_id',
    as: 'folder',
    allowNull: true // Опрос может не принадлежать ни одной папке
});

// Основные ассоциации для Survey-Question-Option
Survey.hasMany(Question, {
    foreignKey: 'survey_id',
    as: 'questions'
});

Question.belongsTo(Survey, {
    foreignKey: 'survey_id',
    as: 'survey'
});

Question.hasMany(Option, {
    foreignKey: 'question_id',
    as: 'options'
});

Option.belongsTo(Question, {
    foreignKey: 'question_id',
    as: 'question'
});

Question.belongsTo(Option, {
    as: 'correctAnswer',
    foreignKey: 'correct_option',
    constraints: false
});

module.exports = {
    sequelize,
    User,
    Class,
    Student,
    Survey,
    Question,
    Option,
    Folder // Добавляем Folder в экспорт
};
