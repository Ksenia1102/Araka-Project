const { Class, Student, TakenSurvey, Survey, TakenQuestion, TakenQuestionAnswer, Question } = require('../models');

class ClassService {
    static async createClass(user_id, title) {
        return await Class.create({ user_id, title });
    }

    static async getClassesByUser(userId) {
        console.log('12121');
        return await Class.findAll({
            where: { user_id: userId },
            attributes: ['id', 'title'],
            include: [
                {
                    model: Student,
                    attributes: []
                }
            ],
            group: ['Class.id'],
            raw: true
        });
    }

    static async getClassDetails(classId) {
        return await Class.findByPk(classId, {
            include: [
                {
                    model: Student,
                    attributes: ['aruco_num', 'name']
                }
            ]
        });
    }

    static async getClassName(classId) {
        const cls = await Class.findByPk(classId, {
            attributes: ['title']
        });
        return cls ? cls.title : null;
    }

    static async getRecentSurveys(classId, limit = 5) {
        try {
            const recent = await TakenSurvey.findAll({
                where: { class_id: classId },
                order: [['date', 'DESC']],
                limit,
                include: [
                    {
                        model: Survey,
                        as: 'survey',
                        attributes: ['title']
                    },
                    {
                        model: TakenQuestion,
                        as: 'takenQuestions',
                        include: [
                            {
                                model: TakenQuestionAnswer,
                                as: 'answers'
                            },
                            {
                                model: Question,
                                as: 'question',
                                attributes: ['correct_option']
                            }
                        ]
                    }
                ]
            });

            const result = recent.map((survey) => {
                let totalAnswers = 0;
                let correctAnswers = 0;

                (survey.takenQuestions || []).forEach((tq) => {
                    const correctOption = tq.question?.correct_option;
                    if (correctOption === undefined) {
                        console.warn(`⚠️ correct_option is missing for question_id=${tq.question_id}`);
                    }

                    (tq.answers || []).forEach((answer) => {
                        totalAnswers++;
                        if (answer.answer === correctOption) {
                            correctAnswers++;
                        }
                    });
                });

                const averageScore = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 10000) / 100 : 0;

                return {
                    survey_id: survey.survey_id,
                    title: survey.survey.title,
                    date: survey.date,
                    average_score: averageScore
                };
            });

            return result;
        } catch (err) {
            console.error('❌ Ошибка при получении недавних тестов с оценками:', err);
            throw err; // или верни []
        }
    }
}

module.exports = ClassService;
