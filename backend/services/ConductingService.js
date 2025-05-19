const { Survey, Question, TakenSurvey, TakenQuestion, TakenQuestionAnswer, Class, Student, Option } = require('../models');
const { Op } = require('sequelize');

const getFileUrl = (folder, fileName) => {
    console.log('mnmnmnmnmn', folder, fileName);
    if (!folder || !fileName) return null;
    // Формируем URL для доступа к файлу в S3
    return `https://16b47e3a-6461-497e-b811-1f088c257053.selstorage.ru/${folder}/${fileName}`;
};
class ConductingService {
    async startSession(surveyId, classId) {
        // 1. Проверка, есть ли TakenSurvey
        let takenSurvey = await TakenSurvey.findOne({
            where: { survey_id: surveyId, class_id: classId }
        });

        // 2. Если нет — создаём
        if (!takenSurvey) {
            takenSurvey = await TakenSurvey.create({
                survey_id: surveyId,
                class_id: classId,
                is_active: true,
                date: new Date()
            });

            // Создаём первый TakenQuestion
            const firstQuestion = await Question.findOne({
                where: { survey_id: surveyId },
                order: [['id', 'ASC']]
            });

            if (!firstQuestion) throw new Error('No questions in this survey');

            const firstOptions = await Option.findAll({
                where: { question_id: firstQuestion.id },
                order: [['text', 'ASC']]
            });

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

        // 3. Если есть — возвращаем последний взятый вопрос и опции
        const lastTakenQuestion = await TakenQuestion.findOne({
            where: { taken_survey_id: takenSurvey.id },
            order: [['id', 'DESC']]
        });

        if (!lastTakenQuestion) {
            // Если вопросов нет, можно создать первый (повторно)
            return await this.startSession(surveyId, classId);
        }

        const question = await Question.findByPk(lastTakenQuestion.question_id);
        const options = await Option.findAll({
            where: { question_id: question.id },
            order: [['text', 'ASC']]
        });

        return {
            taken_survey_id: takenSurvey.id,
            taken_question_id: lastTakenQuestion.id,
            question_id: question.id,
            question_text: question.text,
            options: {
                1: options[0].text,
                2: options[1].text,
                3: options[2].text,
                4: options[3].text
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
    async activateSurvey(takenSurveyId) {
        // Деактивируем все остальные активные тесты
        console.log('Деактивируем все остальные активные тесты');
        await TakenSurvey.update({ is_active: false }, { where: { is_active: true } });
        console.log('Активируем нужный тест');
        // Активируем нужный тест
        await TakenSurvey.update({ is_active: true }, { where: { id: takenSurveyId } });
    }

    async getActiveSurvey() {
        return await TakenSurvey.findOne({
            where: { is_active: true },
            attributes: ['id', 'survey_id', 'class_id'],
            include: [
                {
                    model: Survey,
                    as: 'survey',
                    attributes: ['id', 'title']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'title'] //
                }
            ]
        });
    }

    async getCurrentQuestion() {
        try {
            const activeSurvey = await this.getActiveSurvey();
            if (!activeSurvey) {
                console.log('Активный тест не найден');
                return null;
            }

            console.log('активный тест', activeSurvey.survey.title);

            // Находим последний вопрос
            const currentTakenQuestion = await TakenQuestion.findOne({
                where: {
                    taken_survey_id: activeSurvey.id
                },
                order: [['id', 'DESC']]
            });
            console.log('Находим последний вопрос', currentTakenQuestion);

            if (!currentTakenQuestion) {
                console.log('Вопросы для теста не найдены');
                return {
                    ...activeSurvey,
                    active: true,
                    message: 'В тесте пока нет вопросов'
                };
            }

            // Получаем сам вопрос по его ID напрямую
            const question = await Question.findByPk(currentTakenQuestion.question_id, {
                attributes: ['id', 'text', 'correct_option', 'file_url', 'file_type', 'file_folder', 'file_name']
            });

            if (!question) {
                throw new Error('Question not found');
            }

            // Получаем варианты ответов
            const options = await Option.findAll({
                where: { question_id: question.id },
                order: [['text', 'ASC']],
                attributes: ['id', 'text']
            });
            return {
                active: true,
                title: activeSurvey.survey.title,
                class_name: activeSurvey.class.title,
                taken_survey_id: activeSurvey.id,
                taken_question_id: currentTakenQuestion.id,
                question_id: question.id,
                question_text: question.text,
                file_url: getFileUrl(question.file_folder, question.file_name),
                file_type: question.file_type, // Добавляем поле imageUrl
                options: {
                    1: options[0].text,
                    2: options[1].text,
                    3: options[2].text,
                    4: options[3].text
                }
            };
        } catch (error) {
            console.error('Ошибка в getCurrentQuestion:', error);
            throw error;
        }
    }
}

module.exports = new ConductingService();
