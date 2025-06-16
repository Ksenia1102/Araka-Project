const db = require('../models');
const { Op } = require('sequelize');

const getFilterData = async (userId) => {
  const classes = await db.Class.findAll({
    where: { user_id: userId },
    attributes: ['id', 'title']
  });

  const surveys = await db.Survey.findAll({
    where: { user_id: userId }, // ← добавлено условие по пользователю
    attributes: ['id', 'title']
  });

  return {
    classes: classes.map(c => ({ id: c.id, name: c.title })),
    tests: surveys.map(s => ({ id: s.id, name: s.title }))
  };
};

const getChartStats = async (userId, surveyId, classIds) => {
  // Получаем все taken_surveys для нужного пользователя, класса и теста
  const takenSurveys = await db.TakenSurvey.findAll({
    where: {
      survey_id: surveyId,
      class_id: { [Op.in]: classIds }
    },
    include: [
      {
        model: db.Survey,
        as: 'survey',
        where: { user_id: userId },
        attributes: [] // если не нужны поля survey
      }
    ],
    attributes: ['id', 'class_id']
  });



  const takenSurveyIds = takenSurveys.map(ts => ts.id);

  // Получаем все taken_questions по этим taken_surveys
  const takenQuestions = await db.TakenQuestion.findAll({
    where: {
      taken_survey_id: { [Op.in]: takenSurveyIds }
    },
    attributes: ['id', 'taken_survey_id', 'question_id']
  });

  const questionMap = {};
  for (const tq of takenQuestions) {
    questionMap[tq.id] = {
      question_id: tq.question_id,
      taken_survey_id: tq.taken_survey_id
    };
  }

  const takenQuestionIds = Object.keys(questionMap);

  // Получаем ответы на эти taken_questions
  const answers = await db.TakenQuestionAnswer.findAll({
    where: {
      taken_question_id: { [Op.in]: takenQuestionIds }
    }
  });

  // Получаем все вопросы, чтобы узнать correct_option
  const questionIds = [...new Set(takenQuestions.map(tq => tq.question_id))];
  const questions = await db.Question.findAll({
    where: {
      id: { [Op.in]: questionIds }
    }
  });

  const correctOptionMap = {};
  for (const q of questions) {
    correctOptionMap[q.id] = q.correct_option;
  }

  // Подсчитываем статистику по каждому классу
  const statsByClass = {};

  for (const answer of answers) {
    const tq = questionMap[answer.taken_question_id];
    const classId = takenSurveys.find(ts => ts.id === tq.taken_survey_id)?.class_id;

    if (!classId) continue;

    if (!statsByClass[classId]) {
      statsByClass[classId] = {
        class_id: classId,
        correctAnswers: 0,
        totalAnswers: 0
      };
    }

    const correct = correctOptionMap[tq.question_id];
    if (correct != null && Number(answer.answer) == correct) {
      statsByClass[classId].correctAnswers++;
    }

    statsByClass[classId].totalAnswers++;
  }

  return Object.values(statsByClass);
};

module.exports = {
  getFilterData,
  getChartStats
};
