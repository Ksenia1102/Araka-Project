//FileController.js
const s3Service = require('../services/FileService');
// const multer = require('multer');
// const upload = multer();

// Функция для тестирования загрузки файла
exports.uploadFile = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Файл не найден' });
        }

        // const folder = req.body.folder || 'default';
        // const fileName = `${Date.now()}_${file.originalname}`;

        // const uploadData1 = await s3Service.uploadFile(process.env.SELECTEL_BUCKET, folder, fileName, file.buffer, file.mimetype);
        const uploadData = await s3Service.uploadFileWithValidation(file, 'image', 'uploads');

        res.status(200).json({
            message: 'Файл успешно загружен',
            url: uploadData.Location
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке файла:', error.message);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
};

// Функция для тестирования чтения файла
exports.readFile = async (req, res) => {
    try {
        const { fileName, folder } = req.query;
        const fileData = await s3Service.getFile(process.env.SELECTEL_BUCKET, folder, fileName);
        res.status(200).json({
            message: 'Файл успешно считан',
            content: fileData.Body.toString()
        });
    } catch (error) {
        console.error('❌ Ошибка при чтении файла:', error.message);
        res.status(500).json({ error: 'Ошибка при чтении файла' });
    }
};

// Функция для тестирования удаления файла
exports.deleteFile = async (req, res) => {
    try {
        const { fileName, folder } = req.query;
        await s3Service.deleteFile(process.env.SELECTEL_BUCKET, folder, fileName);
        res.status(200).json({
            message: 'Файл успешно удален'
        });
    } catch (error) {
        console.error('❌ Ошибка при удалении файла:', error.message);
        res.status(500).json({ error: 'Ошибка при удалении файла' });
    }
};

exports.uploadImageFromForm = async (req, res) => {
    try {
        const file = req.file;
        const { mediaType } = req.body; // <-- Берём только mediaType

        if (!file) {
            return res.status(400).json({ error: 'Файл не найден' });
        }

        // Проверяем, что mediaType корректный
        if (!mediaType || !['image', 'audio', 'video'].includes(mediaType)) {
            return res.status(400).json({ error: 'Некорректный mediaType. Допустимо: image, audio, video' });
        }
        const uploadData = await s3Service.uploadFileWithValidation(file, mediaType);
        console.log('Сыллка в контроллере', uploadData.url);
        res.status(200).json({
            message: 'Файл успешно загружен',
            folder: uploadData.folder,
            fileName: uploadData.fileName,
            fileType: uploadData.fileType,
            url: uploadData.url
        });
    } catch (error) {
        console.error('Ошибка при загрузке файла:', error.message);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
};
