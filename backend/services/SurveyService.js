const { Survey, Question, Option } = require('../models');
const { sequelize } = require('../config/database');
class SurveyService {
    static async getSurveyById(id) {
        try {
            if (!id || isNaN(parseInt(id))) {
                throw new Error('Invalid survey ID');
            }

            const survey = await Survey.findByPk(id, {
                include: [
                    {
                        model: Question,
                        as: 'questions',
                        required: false,
                        include: [
                            {
                                model: Option,
                                as: 'options',
                                required: false,
                                attributes: ['id', 'text'],
                                // Явно сортируем по ID, чтобы сохранять порядок
                                order: [['id', 'ASC']]
                            }
                        ],
                        attributes: ['id', 'text', 'correct_option']
                    }
                ],
                attributes: ['id', 'title', 'user_id', 'created_at']
            });

            if (!survey) {
                return null;
            }

            const result = survey.get({ plain: true });

            return {
                id: result.id,
                title: result.title,
                userId: result.user_id,
                createdAt: result.created_at,
                questions: result.questions
                    ? result.questions.map((q) => ({
                          id: q.id,
                          text: q.text,
                          correctOption: q.correct_option,
                          // Сохраняем порядок из базы данных
                          options: q.options || []
                      }))
                    : []
            };
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }

    static async getSurveysByUserId(userId) {
        return await Survey.findAll({ where: { user_id: userId } });
    }

    static async createSurveyWithQuestions({ user_id, title, questions }) {
        return await sequelize.transaction(async (t) => {
            // 1. Создаем опрос
            const survey = await Survey.create(
                {
                    user_id,
                    title
                },
                { transaction: t }
            );

            // 2. Создаем вопросы и варианты ответов
            for (const question of questions) {
                const { text, correct_option, options } = question;

                // Валидация вопроса
                if (!text || !Array.isArray(options)) {
                    throw new Error('Некорректные данные вопроса');
                }

                const createdQuestion = await Question.create(
                    {
                        survey_id: survey.id,
                        text,
                        correct_option
                    },
                    { transaction: t }
                );

                // Создаем варианты ответов
                await Option.bulkCreate(
                    options.map((text) => ({
                        question_id: createdQuestion.id,
                        text
                    })),
                    { transaction: t }
                );
            }

            return survey;
        });
    }
    static async deleteSurvey(id) {
        const survey = await Survey.findByPk(id);
        if (!survey) throw new Error('Survey not found');

        return await sequelize.transaction(async (t) => {
            // Удаляем все связанные варианты ответов
            const questions = await Question.findAll({ where: { survey_id: id } });
            const questionIds = questions.map((q) => q.id);
            await Option.destroy({ where: { question_id: questionIds } }, { transaction: t });

            // Удаляем вопросы
            await Question.destroy({ where: { survey_id: id } }, { transaction: t });

            // Удаляем сам опрос
            await survey.destroy({ transaction: t });
        });
    }

    static async copySurvey(surveyId, userId) {
        return await sequelize.transaction(async (t) => {
            const originalSurvey = await Survey.findByPk(surveyId, { transaction: t });
            if (!originalSurvey) throw new Error('Original survey not found');

            // Создаем копию опроса
            const newSurvey = await Survey.create(
                {
                    title: `${originalSurvey.title} (Копия)`,
                    user_id: userId
                },
                { transaction: t }
            );

            // Копируем вопросы
            const questions = await Question.findAll({
                where: { survey_id: surveyId },
                transaction: t
            });

            for (const question of questions) {
                const newQuestion = await Question.create(
                    {
                        survey_id: newSurvey.id,
                        text: question.text,
                        correct_option: question.correct_option
                    },
                    { transaction: t }
                );

                // Копируем варианты ответов
                const options = await Option.findAll({
                    where: { question_id: question.id },
                    transaction: t
                });

                await Option.bulkCreate(
                    options.map((option) => ({
                        question_id: newQuestion.id,
                        text: option.text
                    })),
                    { transaction: t }
                );
            }

            return newSurvey;
        });
    }
    static async updateSurvey(surveyId, userId, { title, questions }) {
        return await sequelize.transaction(async (t) => {
            // 1. Verify survey exists
            const survey = await Survey.findOne({
                where: { id: surveyId, user_id: userId },
                transaction: t
            });
            if (!survey) throw new Error('Survey not found or not owned by user');

            // 2. Update survey title
            await survey.update({ title }, { transaction: t });

            // 3. Process each question
            for (const question of questions) {
                const { id: questionId, text, correct_option, options } = question;

                if (questionId) {
                    // UPDATE EXISTING QUESTION
                    const [affected] = await Question.update({ text, correct_option }, { where: { id: questionId }, transaction: t });

                    if (affected === 0) throw new Error(`Question ${questionId} not found`);

                    // Process options
                    await this._updateQuestionOptions(questionId, options, t);
                } else {
                    // CREATE NEW QUESTION
                    const newQuestion = await Question.create(
                        {
                            survey_id: surveyId,
                            text,
                            correct_option
                        },
                        { transaction: t }
                    );

                    await Option.bulkCreate(
                        options.map((opt, index) => ({
                            question_id: newQuestion.id,
                            text: opt.text,
                            option_order: index
                        })),
                        { transaction: t }
                    );
                }
            }

            // 4. Delete questions that were removed
            const incomingQuestionIds = questions.map((q) => q.id).filter(Boolean);
            const questionsToDelete = await Question.findAll({
                where: {
                    survey_id: surveyId,
                    id: { [Option.notIn]: incomingQuestionIds }
                },
                transaction: t
            });

            if (questionsToDelete.length > 0) {
                const questionIdsToDelete = questionsToDelete.map((q) => q.id);
                await Option.destroy({
                    where: { question_id: questionIdsToDelete },
                    transaction: t
                });
                await Question.destroy({
                    where: { id: questionIdsToDelete },
                    transaction: t
                });
            }

            return this.getSurveyById(surveyId);
        });
    }

    static async _updateQuestionOptions(questionId, newOptions, transaction) {
        const existingOptions = await Option.findAll({
            where: { question_id: questionId },
            order: [['id', 'ASC']],
            transaction
        });

        // Update existing options
        for (let i = 0; i < Math.min(existingOptions.length, newOptions.length); i++) {
            await existingOptions[i].update(
                {
                    text: newOptions[i].text
                },
                { transaction }
            );
        }

        // Add new options if needed
        if (newOptions.length > existingOptions.length) {
            await Option.bulkCreate(
                newOptions.slice(existingOptions.length).map((opt, i) => ({
                    question_id: questionId,
                    text: opt.text,
                    option_order: existingOptions.length + i
                })),
                { transaction }
            );
        }

        // Remove excess options
        if (existingOptions.length > newOptions.length) {
            await Option.destroy({
                where: {
                    id: existingOptions.slice(newOptions.length).map((o) => o.id)
                },
                transaction
            });
        }
    }
}

module.exports = SurveyService;
