const { Survey, Question, TakenSurvey, TakenQuestion, TakenQuestionAnswer, Class, Student, Option } = require('../models');
const { Op } = require('sequelize');

class ConductingService {
    async startSession(surveyId, classId) {
        // Проверяем существование опроса
        console.log(surveyId, classId);
        const survey = await Survey.findByPk(surveyId);
        if (!survey) {
            throw new Error('Survey not found');
        }

        // Проверяем существование класса
        const classExists = await Class.findByPk(classId);
        if (!classExists) {
            throw new Error('Class not found');
        }

        // Создаем запись о начале опроса
        const takenSurvey = await TakenSurvey.create({
            survey_id: surveyId,
            class_id: classId
        });

        // Получаем первый вопрос опроса
        const firstQuestion = await Question.findOne({
            where: { survey_id: surveyId },
            order: [['id', 'ASC']]
        });

        if (!firstQuestion) {
            throw new Error('No questions found in this survey');
        }

        // Получаем первый вопрос опроса
        const firstOptions = await Option.findAll({
            where: { question_id: firstQuestion.id },
            order: [['text', 'ASC']]
        });

        if (!firstOptions) {
            throw new Error('No Options found in this survey');
        }

        // Создаем запись о взятом вопросе
        const takenQuestion = await TakenQuestion.create({
            taken_survey_id: takenSurvey.id,
            question_id: firstQuestion.id
        });

        return {
            taken_survey_id: takenSurvey.id,
            taken_question_id: takenQuestion.id,
            question_id: firstQuestion.id,
            question_text: firstQuestion.text,
            options: {
                1: firstOptions[0].text,
                2: firstOptions[1].text,
                3: firstOptions[2].text,
                4: firstOptions[3].text
            }
        };
    }

    async saveAnswers(takenSurveyId, takenQuestionId, answers) {
        // Проверяем существование takenQuestion
        const takenQuestion = await TakenQuestion.findByPk(takenQuestionId, {
            include: [
                {
                    model: Question,
                    as: 'question'
                },
                {
                    model: TakenSurvey,
                    as: 'takenSurvey'
                }
            ]
        });

        if (!takenQuestion) {
            throw new Error('Taken question not found');
        }

        // Проверяем, что вопрос принадлежит указанному опросу
        if (takenQuestion.taken_survey_id !== parseInt(takenSurveyId)) {
            throw new Error('Question does not belong to this survey session');
        }

        // Сохраняем ответы
        const answerRecords = await Promise.all(
            answers.map(async (answer) => {
                // Проверяем существование студента
                const student = await Student.findByPk(answer.student_id);
                if (!student) {
                    throw new Error(`Student with id ${answer.student_id} not found`);
                }

                return TakenQuestionAnswer.create({
                    taken_question_id: takenQuestionId,
                    student_id: answer.student_id,
                    answer: answer.answer
                });
            })
        );

        // Получаем следующий вопрос
        const nextQuestion = await Question.findOne({
            where: {
                survey_id: takenQuestion.takenSurvey.survey_id,
                id: { [Op.gt]: takenQuestion.question_id }
            },
            order: [['id', 'ASC']]
        });

        if (nextQuestion) {
            const nextOption = await Option.findAll({
                where: {
                    question_id: nextQuestion.id
                },
                order: [['text', 'ASC']]
            });
            // Создаем запись о новом взятом вопросе
            const newTakenQuestion = await TakenQuestion.create({
                taken_survey_id: takenSurveyId,
                question_id: nextQuestion.id
            });

            return {
                status: 'next_question',
                taken_question_id: newTakenQuestion.id,
                question_id: nextQuestion.id,
                question_text: nextQuestion.text,
                options: {
                    1: nextOption[0].text,
                    2: nextOption[1].text,
                    3: nextOption[2].text,
                    4: nextOption[3].text
                }
            };
        }

        // Если вопросов больше нет
        return {
            status: 'survey_completed',
            taken_survey_id: takenSurveyId
        };
    }
}

module.exports = new ConductingService();
