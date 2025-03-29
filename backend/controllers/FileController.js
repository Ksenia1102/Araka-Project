const s3Service = require('../services/FileService');
// const multer = require('multer');
// const upload = multer();

// Функция для тестирования загрузки файла
exports.uploadFile = async (req, res) => {
    try {
        const { fileName, fileContent, folder } = req.body;
        const uploadData = await s3Service.uploadFile(process.env.SELECTEL_BUCKET, folder, fileName, fileContent);
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
