const sequelize = require('../config/database');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const Survey = require('./Survey');
const Question = require('./Question');
const Option = require('./Option');
const Folder = require('./Folder');
const TakenSurvey = require('./TakenSurvey');
const TakenQuestion = require('./TakenQuestion');
const TakenQuestionAnswer = require('./TakenQuestionAnswer');

// Устанавливаем связи пользователя
User.hasMany(Class, { foreignKey: 'user_id' });
Class.belongsTo(User, { foreignKey: 'user_id' });

Class.hasMany(Student, { foreignKey: 'class_id' });
Student.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

// Связи для опросов и папок
User.hasMany(Survey, { foreignKey: 'user_id' });
Survey.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Folder, { foreignKey: 'user_id' });
Folder.belongsTo(User, { foreignKey: 'user_id' });

Folder.hasMany(Survey, {
    foreignKey: 'folder_id',
    as: 'surveys'
});
Survey.belongsTo(Folder, {
    foreignKey: 'folder_id',
    as: 'folder',
    allowNull: true
});

// Основные ассоциации Survey-Question-Option
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

// Связи для проведения опросов
Survey.hasMany(TakenSurvey, {
    foreignKey: 'survey_id',
    as: 'takenSurveys'
});
TakenSurvey.belongsTo(Survey, {
    foreignKey: 'survey_id',
    as: 'survey'
});

Class.hasMany(TakenSurvey, {
    foreignKey: 'class_id',
    as: 'takenSurveys'
});
TakenSurvey.belongsTo(Class, {
    foreignKey: 'class_id',
    as: 'class'
});

TakenSurvey.hasMany(TakenQuestion, {
    foreignKey: 'taken_survey_id',
    as: 'takenQuestions'
});
TakenQuestion.belongsTo(TakenSurvey, {
    foreignKey: 'taken_survey_id',
    as: 'takenSurvey'
});

Question.hasMany(TakenQuestion, {
    foreignKey: 'question_id',
    as: 'takenQuestions'
});
TakenQuestion.belongsTo(Question, {
    foreignKey: 'question_id',
    as: 'question'
});

TakenQuestion.hasMany(TakenQuestionAnswer, {
    foreignKey: 'taken_question_id',
    as: 'answers'
});
TakenQuestionAnswer.belongsTo(TakenQuestion, {
    foreignKey: 'taken_question_id',
    as: 'takenQuestion'
});

Student.hasMany(TakenQuestionAnswer, {
    foreignKey: 'student_id',
    as: 'answers'
});
TakenQuestionAnswer.belongsTo(Student, {
    foreignKey: 'student_id',
    as: 'student'
});

module.exports = {
    sequelize,
    User,
    Class,
    Student,
    Survey,
    Question,
    Option,
    Folder,
    TakenSurvey,
    TakenQuestion,
    TakenQuestionAnswer
};
