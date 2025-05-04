const s3Service = require('../services/FileService');

/**
 * Загрузка реального файла через form-data
 * req.file — файл, загруженный через multer
 * req.body.folder — опциональная папка в бакете
 */
exports.uploadFile = async (req, res) => {
    try {
        const file = req.file;
        const folder = req.body.folder || '';
        const fileName = file.originalname;
        const fileContent = file.buffer;

        const uploadData = await s3Service.uploadFile(
            process.env.SELECTEL_BUCKET,
            folder,
            fileName,
            fileContent,
            file.mimetype // будем передавать тип содержимого
        );

        res.status(200).json({
            message: 'Файл успешно загружен',
            url: uploadData.Location
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке файла:', error.message);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
};
