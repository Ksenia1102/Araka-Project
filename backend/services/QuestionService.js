// const { Question, Option, sequelize } = require('../models');
// const sequelize = require('../config/database'); // Убедитесь, что это правильный импор
// class QuestionService {
//     static async addQuestions(survey_id, questions) {
//         return await sequelize.transaction(async (t) => {
//             const createdQuestions = [];

//             for (const question of questions) {
//                 const { text, correct_option, options } = question;

//                 // Создаем вопрос
//                 const createdQuestion = await Question.create(
//                     {
//                         survey_id: survey_id,
//                         text,
//                         correct_option
//                     },
//                     { transaction: t }
//                 );

//                 // Создаем варианты ответов
//                 if (options && options.length > 0) {
//                     await Option.bulkCreate(
//                         options.map((text) => ({
//                             question_id: createdQuestion.id,
//                             text
//                         })),
//                         { transaction: t }
//                     );
//                 }

//                 createdQuestions.push(createdQuestion);
//             }

//             return createdQuestions;
//         });
//     }
// }

// module.exports = QuestionService;
