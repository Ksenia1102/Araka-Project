const { Survey, Question, Option } = require('../models');
const { sequelize } = require('../models');
class SurveyService {
    // Создание опроса с вопросами и вариантами
    static async createSurvey(userId, title, questions) {
        return await sequelize.transaction(async (t) => {
            const survey = await Survey.create({ user_id: userId, title }, { transaction: t });

            for (const question of questions) {
                const q = await Question.create(
                    {
                        survey_id: survey.id,
                        text: question.text,
                        correct_option: question.correct_option
                    },
                    { transaction: t }
                );

                await Option.bulkCreate(
                    question.options.map((text) => ({ question_id: q.id, text })),
                    { transaction: t }
                );
            }

            return survey;
        });
    }

    // Получение опроса по ID
    static async getSurvey(surveyId) {
        return await Survey.findByPk(surveyId, {
            include: [
                {
                    model: Question,
                    include: [Option]
                }
            ]
        });
    }

    static async getSurveyWithDetails(surveyId) {
        return await Survey.findByPk(surveyId, {
            include: [
                {
                    model: Question,
                    include: [
                        {
                            model: Option,
                            attributes: ['text']
                        }
                    ]
                }
            ]
        });
    }
}

module.exports = SurveyService;
