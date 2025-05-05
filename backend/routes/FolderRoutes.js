const express = require('express');
const router = express.Router();
const FolderController = require('../controllers/FolderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Основные CRUD операции для папок
router.get('/', FolderController.getAllFolders); // Получить все папки пользователя
router.get('/:id', FolderController.getFolder); // Получить конкретную папку
router.post('/', FolderController.createFolder); // Создать новую папку
router.put('/:id', FolderController.updateFolder); // Обновить папку (например, переименовать)
router.delete('/:id', FolderController.deleteFolder); // Удалить папку

// Операции с опросами внутри папок
router.get('/unfoldered/surveys', FolderController.getUnfolderedSurveys);
router.get('/:id/surveys', FolderController.getFolderSurveys); // Получить все опросы в папке
router.put('/:id/surveys', FolderController.addSurveyToFolder); // Добавить опрос в папку
router.delete('/surveys/:survey_id', FolderController.removeSurveyFromFolder); // Удалить опрос из папки

module.exports = router;
