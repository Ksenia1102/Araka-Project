const { Survey, Question, TakenSurvey, TakenQuestion, TakenQuestionAnswer, Class, Student, Option } = require('../models');
const { Op } = require('sequelize');

const getFileUrl = (folder, fileName) => {
    console.log('mnmnmnmnmn', folder, fileName);
    if (!folder || !fileName) return null;
    // Формируем URL для доступа к файлу в S3
    return `https://16b47e3a-6461-497e-b811-1f088c257053.selstorage.ru/${folder}/${fileName}`;
};
class ConductingService {
    async startSession(userId, surveyId, classId) {
        const userClasses = await Class.findAll({
            where: {
                user_id: userId // замените на вашу логику связи
            },
            attributes: ['id']
        });

        const userClassIds = (await Class.findAll({ where: { user_id: userId }, attributes: ['id'] })).map((c) => c.id);

        const userSurveyIds = (await Survey.findAll({ where: { user_id: userId }, attributes: ['id'] })).map((s) => s.id);

        const hasAccessToClass = userClassIds.includes(parseInt(classId));
        const hasAccessToSurvey = userSurveyIds.includes(parseInt(surveyId));

        if (!hasAccessToClass && !hasAccessToSurvey) {
            throw new Error('Пользователь не имеет доступа к указанному классу и опросу');
        }
        if (!hasAccessToClass) {
            throw new Error('Пользователь не имеет доступа к указанному классу');
        }
        if (!hasAccessToSurvey) {
            throw new Error('Пользователь не имеет доступа к указанному опросу');
        }

        const classIds = userClasses.map((c) => c.id);
        // Проверка доступа
        if (!classIds.includes(parseInt(classId))) {
            throw new Error('Пользователь не имеет доступа к указанному классу');
        }

        // Деактивируем все активные тесты в этих классах
        await TakenSurvey.update(
            { is_active: false },
            {
                where: {
                    class_id: classIds,
                    is_active: true
                }
            }
        );
        // Вспомогательная функция для формирования mobileData и frontendData
        const formatReturnData = async (takenSurvey, takenQuestion, question) => {
            const options = await Option.findAll({
                where: { question_id: question.id },
                order: [['id', 'ASC']]
            });

            const activeSurvey = await this.getActiveSurvey(userId);
            if (!activeSurvey) {
                console.log('Активный тест не найден');
                return null;
            }

            const mobileData = {
                taken_survey_id: takenSurvey.id,
                taken_question_id: takenQuestion.id,
                question_id: question.id,
                question_text: question.text,
                options: {
                    1: options[0]?.text || '',
                    2: options[1]?.text || '',
                    3: options[2]?.text || '',
                    4: options[3]?.text || ''
                }
            };

            const frontendData = {
                active: true,
                title: activeSurvey.survey.title,
                class_name: activeSurvey.class.title,
                class_id: activeSurvey.class_id,
                taken_survey_id: activeSurvey.id,
                taken_question_id: takenQuestion.id,
                question_id: question.id,
                question_text: question.text,
                file_url: getFileUrl(question.file_folder, question.file_name),
                file_type: question.file_type,
                options: {
                    1: options[0]?.text || '',
                    2: options[1]?.text || '',
                    3: options[2]?.text || '',
                    4: options[3]?.text || ''
                }
            };
            console.log({ mobileData, frontendData });
            return { mobileData, frontendData };
        };

        // Проверяем, есть ли активный TakenSurvey
        let takenSurvey = await TakenSurvey.findOne({
            where: { survey_id: surveyId, class_id: classId, is_active: true }
        });

        if (!takenSurvey) {
            takenSurvey = await TakenSurvey.create({
                survey_id: surveyId,
                class_id: classId,
                is_active: true,
                date: new Date()
            });
            console.log('БД запуска теста');

            // Создаём первый TakenQuestion
            const firstQuestion = await Question.findOne({
                where: { survey_id: surveyId },
                order: [['id', 'ASC']]
            });

            if (!firstQuestion) throw new Error('No questions in this survey');

            const takenQuestion = await TakenQuestion.create({
                taken_survey_id: takenSurvey.id,
                question_id: firstQuestion.id
            });

            return formatReturnData(takenSurvey, takenQuestion, firstQuestion);
        }

        await takenSurvey.update({ is_active: true });
        // Есть TakenSurvey — находим последний TakenQuestion
        const lastTakenQuestion = await TakenQuestion.findOne({
            where: { taken_survey_id: takenSurvey.id },
            order: [['id', 'ASC']]
        });

        if (!lastTakenQuestion) {
            // Если вопросов нет, создаём первый вопрос заново
            return await this.startSession(surveyId, classId);
        }

        const question = await Question.findByPk(lastTakenQuestion.question_id);

        return formatReturnData(takenSurvey, lastTakenQuestion, question);
    }

    async saveAnswers(userId, takenSurveyId, takenQuestionId, answers) {
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

        // Сохраняем ответы ПРАВИЛЬНО
        const answerRecords = await Promise.all(
            answers.map(async (answer) => {
                // Проверяем существование студента
                const student = await Student.findByPk(answer.student_id);
                if (!student) {
                    throw new Error(`Student with id ${answer.student_id} not found`);
                }

                // Проверка на наличие уже сохранённого ответа
                const existingAnswer = await TakenQuestionAnswer.findOne({
                    where: {
                        taken_question_id: takenQuestionId,
                        student_id: answer.student_id
                    }
                });

                if (existingAnswer) {
                    // Обновляем существующий ответ
                    return await existingAnswer.update({
                        answer: answer.answer
                    });
                } else {
                    // Создаём новый, если не найден
                    return await TakenQuestionAnswer.create({
                        taken_question_id: takenQuestionId,
                        student_id: answer.student_id,
                        answer: answer.answer
                    });
                }
            })
        );

        const activeSurvey = await this.getActiveSurvey(userId);
        if (!activeSurvey) {
            console.log('Активный тест не найден');
            return null;
        }

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
            // Создаем запись о новом взятом вопросе Правильно!!)
            let newTakenQuestion = await TakenQuestion.findOne({
                where: {
                    taken_survey_id: takenSurveyId,
                    question_id: nextQuestion.id
                }
            });

            if (!newTakenQuestion) {
                newTakenQuestion = await TakenQuestion.create({
                    taken_survey_id: takenSurveyId,
                    question_id: nextQuestion.id
                });
            }

            const lastTakenQuestion = await TakenQuestion.findOne({
                where: { taken_survey_id: takenSurveyId },
                order: [['id', 'DESC']]
            });

            const newQuestion = await Question.findByPk(lastTakenQuestion.question_id);

            const options = await Option.findAll({
                where: { question_id: newQuestion.id },
                order: [['id', 'ASC']]
            });

            const mobileData = {
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

            const frontendData = {
                active: true,
                title: activeSurvey.survey.title,
                class_name: activeSurvey.class.title,
                class_id: activeSurvey.class_id,
                taken_survey_id: activeSurvey.id,
                taken_question_id: takenQuestion.id,
                question_id: newQuestion.id,
                question_text: newQuestion.text,
                file_url: getFileUrl(newQuestion.file_folder, newQuestion.file_name),
                file_type: newQuestion.file_type,
                options: {
                    1: options[0]?.text || '',
                    2: options[1]?.text || '',
                    3: options[2]?.text || '',
                    4: options[3]?.text || ''
                }
            };

            return {
                status: 'next_question',
                mobileData,
                frontendData,
                taken_survey_id: takenSurveyId
            };
        }

        // Если вопросов больше нет
        // Останавливаем тест, деактивируем текущий TakenSurvey
        await TakenSurvey.update({ is_active: false }, { where: { id: takenSurveyId } });
        const takenSurvey = await TakenSurvey.findByPk(takenSurveyId, {
            include: ['survey', 'class']
        });
        console.log(takenSurvey);

        const frontendData = {
            active: false,
            title: takenSurvey?.survey?.title || '',
            class_name: takenSurvey?.class?.title || '',
            taken_survey_id: takenSurveyId
        };

        return {
            status: 'survey_completed',
            mobileData: null,
            frontendData,
            taken_survey_id: takenSurveyId
        };
    }
    async getSurveyResults(classId, surveyId) {
        const results = await TakenQuestionAnswer.findAll({
            include: [
                {
                    model: TakenQuestion,
                    as: 'takenQuestion',
                    attributes: ['question_id'],
                    required: true,
                    include: [
                        {
                            model: TakenSurvey,
                            as: 'takenSurvey',
                            where: {
                                survey_id: surveyId,
                                class_id: classId
                            },
                            required: true,
                            attributes: []
                        },
                        {
                            model: Question,
                            as: 'question',
                            attributes: ['correct_option']
                        }
                    ]
                },
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'name'],
                    required: true
                }
            ]
        });

        const resultsWithIsCorrect = results.map((r) => {
            const correctOption = r.takenQuestion?.question?.correct_option;
            const isCorrect = r.answer === correctOption ? 1 : 0;
            return {
                ...r.get({ plain: true }),
                isCorrect
            };
        });

        return resultsWithIsCorrect;
    }

    async activateSurvey(takenSurveyId) {
        // Деактивируем все остальные активные тесты
        console.log('Деактивируем все остальные активные тесты');
        await TakenSurvey.update({ is_active: false }, { where: { is_active: true } });
        console.log('Активируем нужный тест');
        // Активируем нужный тест
        await TakenSurvey.update({ is_active: true }, { where: { id: takenSurveyId } });
    }

    async getActiveSurvey(userId) {
        // Получаем ID классов, к которым у пользователя есть доступ
        const userClassIds = (
            await Class.findAll({
                where: { user_id: userId },
                attributes: ['id']
            })
        ).map((c) => c.id);

        if (userClassIds.length === 0) {
            return null; // У пользователя нет классов
        }

        // Ищем активный TakenSurvey только в классах пользователя
        return await TakenSurvey.findOne({
            where: {
                is_active: true,
                class_id: userClassIds // Только классы пользователя
            },
            include: [
                {
                    model: Survey,
                    as: 'survey',
                    attributes: ['id', 'title']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'title']
                }
            ]
        });
    }
    async getClassStudents(classId) {
        return await Student.findAll({
            where: { class_id: classId },
            attributes: ['id', 'name', 'aruco_num'],
            order: [['name', 'ASC']]
        });
    }

    async getStudentAnswers(surveyId) {
        return await TakenQuestionAnswer.findAll({
            include: [
                {
                    model: Student,
                    attributes: ['id', 'name'],
                    required: true
                },
                {
                    model: TakenQuestion,
                    attributes: ['id'],
                    include: [
                        {
                            model: TakenSurvey,
                            where: { survey_id: surveyId },
                            attributes: []
                        }
                    ],
                    required: true
                }
            ],
            attributes: ['id', 'answer', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
    }
}

module.exports = new ConductingService();
