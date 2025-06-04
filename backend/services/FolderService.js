const { Folder, Survey } = require('../models');

class FolderService {
    // Получить все папки пользователя
    static async getUserFolders(userId) {
        return await Folder.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Survey,
                    as: 'surveys',
                    attributes: ['id', 'title', 'created_at']
                }
            ]
        });
    }

    // Получить конкретную папку пользователя
    static async getUserFolder(folderId, userId) {
        return await Folder.findOne({
            where: {
                id: folderId,
                user_id: userId
            },
            include: [
                {
                    model: Survey,
                    as: 'surveys',
                    attributes: ['id', 'title', 'created_at']
                }
            ]
        });
    }

    static async createFolder(name, userId, surveyIds = []) {
        const folder = await Folder.create({
            name,
            user_id: userId
        });

        if (Array.isArray(surveyIds) && surveyIds.length > 0) {
            await Survey.update({ folder_id: folder.id }, { where: { id: surveyIds } });
        }

        return folder;
    }

    // Обновить папку
    static async updateFolder(folderId, userId, newName) {
        const [updated] = await Folder.update(
            { name: newName },
            {
                where: {
                    id: folderId,
                    user_id: userId
                }
            }
        );

        if (!updated) return null;
        return await Folder.findByPk(folderId);
    }

    // Удалить папку
    static async deleteFolder(folderId, userId) {
        // Устанавливаем folder_id в null для всех опросов в этой папке
        // await Survey.update({ folder_id: null }, { where: { folder_id: folderId } });
        await Survey.destroy({ where: { folder_id: folderId } });

        return await Folder.destroy({
            where: {
                id: folderId,
                user_id: userId
            }
        });
    }

    // Получить опросы в папке
    static async getFolderSurveys(folderId, userId) {
        const folder = await Folder.findOne({
            where: {
                id: folderId,
                user_id: userId
            },
            include: [
                {
                    model: Survey,
                    as: 'surveys',
                    attributes: ['id', 'title', 'created_at']
                }
            ]
        });

        return folder ? folder.surveys : null;
    }

    // Добавить опрос в папку
    static async addSurveyToFolder(folderId, surveyId, userId) {
        // Проверяем существование опроса и папки
        const [survey, folder] = await Promise.all([Survey.findOne({ where: { id: surveyId, user_id: userId } }), Folder.findOne({ where: { id: folderId, user_id: userId } })]);

        if (!survey || !folder) return false;

        await survey.update({ folder_id: folder.id });
        return true;
    }

    // Удалить опрос из папки
    static async removeSurveyFromFolder(folderId, surveyId, userId) {
        const survey = await Survey.findOne({
            where: {
                id: surveyId,
                user_id: userId,
                folder_id: folderId
            }
        });

        if (!survey) return false;

        await survey.update({ folder_id: null });
        return true;
    }

    static async getUnfolderedSurveys(userId) {
        return await Survey.findAll({
            where: {
                user_id: userId,
                folder_id: null
            },
            attributes: ['id', 'title', 'created_at']
        });
    }

    static async removeSurveyFromAnyFolder(surveyId) {
        // Найти survey, убедиться, что он принадлежит этому пользователю и он в папке
        const survey = await Survey.findOne({
            where: {
                id: surveyId
            }
        });

        if (!survey) {
            return false;
        }

        // Удаляем из папки (обнуляем folder_id)
        survey.folder_id = null;
        await survey.save();

        return true;
    }
}

module.exports = FolderService;
