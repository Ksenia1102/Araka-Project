//services/SurveyService.js
const { Survey, Question, Option } = require('../models');
const { sequelize } = require('../config/database');
const FileService = require('../services/FileService');

const getFileUrl = (folder, fileName) => {
    console.log('mnmnmnmnmn', folder, fileName);
    if (!folder || !fileName) return null;
    // Формируем URL для доступа к файлу в S3
    return `https://16b47e3a-6461-497e-b811-1f088c257053.selstorage.ru/${folder}/${fileName}`;
};
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
                        attributes: ['id', 'text', 'correct_option', 'file_url', 'file_type', 'file_folder', 'file_name'] // Добавляем поле imageUrl
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
                          file_url: getFileUrl(q.file_folder, q.file_name),
                          file_type: q.file_type, // Добавляем поле imageUrl
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
                const { text, correct_option, options, file_url, file_folder, file_name, file_type } = question;

                console.log(file_url); // Здесь ты уже получаешь URL изображения

                // Валидация вопроса
                if (!text || !Array.isArray(options)) {
                    throw new Error('Некорректные данные вопроса');
                }

                // Проверка на наличие загруженного файла
                let uploadedFileUrl = null;
                if (file_url) {
                    uploadedFileUrl = file_url; // Используем URL, если файл был загружен
                }

                const createdQuestion = await Question.create(
                    {
                        survey_id: survey.id,
                        text,
                        correct_option,
                        file_url: uploadedFileUrl,
                        file_folder: file_folder || null,
                        file_name: file_name || null,
                        file_type: file_type || null // Добавляем URL файла в поле
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

            for (let question of questions) {
                if (question.file_url && question.file_folder && question.file_name) {
                    // Удаляем файл из S3
                    await FileService.deleteFileFromS3(question.file_folder, question.file_name);
                }
            }

            const questionIds = questions.map((q) => q.id);
            await Option.destroy({ where: { question_id: questionIds } }, { transaction: t });

            // Удаляем вопросы
            await Question.destroy({ where: { survey_id: id } }, { transaction: t });

            // Удаляем сам опрос
            await survey.destroy({ transaction: t });
        });
    }

    static async copySurvey(surveyId) {
        return await sequelize.transaction(async (t) => {
            const originalSurvey = await Survey.findByPk(surveyId, { transaction: t });
            if (!originalSurvey) throw new Error('Original survey not found');

            // Создаем копию опроса
            const newSurvey = await Survey.create(
                {
                    title: `${originalSurvey.title} (Копия)`,
                    user_id: originalSurvey.user_id
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
                        correct_option: question.correct_option,
                        file_url: question.file_url, // Используем старый URL файла
                        file_folder: question.file_folder, // Используем старую папку
                        file_name: question.file_name, // Используем старое имя файла
                        file_type: question.file_type // Используем старое имя файла
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
    static async updateSurvey(surveyId, userId, { title, questions, files }) {
        return await sequelize.transaction(async (t) => {
            // 1. Проверяем, что опрос существует и принадлежит пользователю
            const survey = await Survey.findOne({
                where: { id: surveyId, user_id: userId },
                transaction: t
            });
            if (!survey) throw new Error('Survey not found or not owned by user');

            // 2. Обновляем заголовок опроса
            await survey.update({ title }, { transaction: t });

            // 3. Обрабатываем каждый вопрос
            const incomingQuestionIds = [];
            console.log('question', questions);
            for (const question of questions) {
                const { id: questionId, text, correct_option, options, file_url, file_folder, file_name, file_type } = question;

                let uploadedFileUrl = file_url || null;
                let uploadedFileFolder = file_folder || null;
                let uploadedFileName = file_name || null;
                let uploadedFileType = file_type || null;

                // Если есть новые файлы с фронта — используем их
                if (files && files[questionId]) {
                    uploadedFileUrl = files[questionId].url;
                    uploadedFileFolder = files[questionId].folder;
                    uploadedFileName = files[questionId].fileName;
                    uploadedFileType = files[questionId].fileType;
                }
                console.log('questionId', questionId);
                if (questionId) {
                    // UPDATE EXISTING QUESTION
                    const [affected] = await Question.update(
                        {
                            text,
                            correct_option,
                            file_url: uploadedFileUrl,
                            file_folder: uploadedFileFolder,
                            file_name: uploadedFileName,
                            file_type: uploadedFileType
                        },
                        {
                            where: { id: questionId },
                            transaction: t
                        }
                    );

                    if (affected === 0) throw new Error(`Question ${questionId} not found`);

                    incomingQuestionIds.push(questionId);

                    // Обновляем опции вопроса
                    await this._updateQuestionOptions(questionId, options, t);
                } else {
                    // CREATE NEW QUESTION
                    const newQuestion = await Question.create(
                        {
                            survey_id: surveyId,
                            text,
                            correct_option,
                            file_url: uploadedFileUrl,
                            file_folder: uploadedFileFolder,
                            file_name: uploadedFileName,
                            file_type: uploadedFileType
                        },
                        { transaction: t }
                    );

                    incomingQuestionIds.push(newQuestion.id);

                    // Создаем опции для нового вопроса
                    await Option.bulkCreate(
                        options.map((opt, index) => ({
                            question_id: newQuestion.id,
                            text: opt,
                            option_order: index
                        })),
                        { transaction: t }
                    );
                }
            }

            // 4. Удаляем вопросы, которых нет в новом списке
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

        console.log('existingOptions', existingOptions);

        // Обновляем существующие опции
        const updatePromises = existingOptions.slice(0, newOptions.length).map((opt, i) =>
            opt.update(
                {
                    text: newOptions[i],
                    option_order: i // Обновляем порядок тоже
                },
                { transaction }
            )
        );

        await Promise.all(updatePromises);

        // Добавляем новые опции
        if (newOptions.length > existingOptions.length) {
            const newOptsToCreate = newOptions.slice(existingOptions.length);

            // Проверка, что все новые варианты имеют текст
            if (newOptsToCreate.some((opt) => !opt)) {
                throw new Error('New options must have text');
            }

            await Option.bulkCreate(
                newOptsToCreate.map((opt, i) => ({
                    question_id: questionId,
                    opt, // Убедитесь, что это поле присутствует
                    option_order: existingOptions.length + i
                })),
                { transaction }
            );
        }

        // Удаляем лишние опции
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
