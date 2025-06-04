const FolderService = require('../services/FolderService');

class FolderController {
    // Получить все папки пользователя
    static async getAllFolders(req, res) {
        try {
            const folders = await FolderService.getUserFolders(req.user.id);
            res.json(folders);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Получить конкретную папку
    static async getFolder(req, res) {
        try {
            const folder = await FolderService.getUserFolder(req.params.id, req.user.id);

            if (!folder) {
                return res.status(404).json({ message: 'Folder not found' });
            }

            res.json(folder);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Создать новую папку
    static async createFolder(req, res) {
        try {
            const { name, survey_ids } = req.body;
            const folder = await FolderService.createFolder(name, req.user.id, survey_ids);
            res.status(201).json(folder);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Обновить папку
    static async updateFolder(req, res) {
        try {
            const { name } = req.body;
            const updatedFolder = await FolderService.updateFolder(req.params.id, req.user.id, name);

            if (!updatedFolder) {
                return res.status(404).json({ message: 'Folder not found' });
            }

            res.json(updatedFolder);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Удалить папку
    static async deleteFolder(req, res) {
        try {
            const deleted = await FolderService.deleteFolder(req.params.id, req.user.id);

            if (!deleted) {
                return res.status(404).json({ message: 'Folder not found' });
            }

            res.json({ message: 'Folder deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Получить опросы в папке
    static async getFolderSurveys(req, res) {
        try {
            const surveys = await FolderService.getFolderSurveys(req.params.id, req.user.id);

            if (!surveys) {
                return res.status(404).json({ message: 'Folder not found11212' });
            }

            res.json(surveys);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Добавить опрос в папку
    static async addSurveyToFolder(req, res) {
        try {
            const { survey_id } = req.body;
            const success = await FolderService.addSurveyToFolder(req.params.id, survey_id, req.user.id);

            if (!success) {
                return res.status(404).json({
                    message: 'Folder or survey not found, or survey does not belong to user'
                });
            }

            res.json({ message: 'Survey added to folder successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Удалить опрос из папки
    static async removeSurveyFromFolder(req, res) {
        try {
            const surveyId = req.params.survey_id;
            // const userId = req.user.id;

            const success = await FolderService.removeSurveyFromAnyFolder(surveyId);

            if (!success) {
                return res.status(404).json({
                    message: 'Survey not found in this folder'
                });
            }

            res.json({ message: 'Survey removed from folder successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Получить опросы без папки
    static async getUnfolderedSurveys(req, res) {
        try {
            const surveys = await FolderService.getUnfolderedSurveys(req.user.id);

            // Проверка на случай, если нет опросов без папки
            if (!surveys || surveys.length === 0) {
                return res.status(404).json({ message: 'No surveys found without folders' });
            }

            res.json(surveys);
        } catch (error) {
            console.error('Ошибка при получении опросов без папки:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = FolderController;
