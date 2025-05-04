const s3 = require('../config/s3Client');
console.log('Тип объекта s3:', typeof s3); // Должно вывести "object"
console.log('Методы и свойства объекта s3:', Object.keys(s3)); // Покажет все методы и свойства

const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Конфигурация валидации
const VALIDATION_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: {
        image: ['image/jpeg', 'image/png', 'image/gif'],
        audio: ['audio/mpeg', 'audio/wav'],
        video: ['video/mp4', 'video/quicktime']
    }
};

// Логирование в файл
const fs = require('fs');
const LOG_FILE = 's3_operations.log';

class FileService {
    /**
     * Генерация pre-signed URL для скачивания
     * @param {string} bucket - Название бакета
     * @param {string} folder - Папка в S3
     * @param {string} fileName - Имя файла
     * @param {number} expiresIn - Время жизни ссылки в секундах (по умолчанию 1 час)
     */
    static async generatePresignedUrl(bucket, folder, fileName, expiresIn = 3600) {
        const params = {
            Bucket: bucket,
            Key: `${folder}/${fileName}`,
            Expires: expiresIn
        };

        try {
            const url = await s3.getSignedUrlPromise('getObject', params);
            this._logOperation('GENERATE_PRESIGNED_URL', { bucket, folder, fileName });
            return url;
        } catch (error) {
            this._logOperation('GENERATE_PRESIGNED_URL_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Генерация pre-signed URL для загрузки
     * @param {string} bucket - Название бакета
     * @param {string} folder - Папка в S3
     * @param {string} fileName - Имя файла
     * @param {string} fileType - MIME-тип файла
     * @param {number} expiresIn - Время жизни ссылки в секундах
     */
    static async generateUploadUrl(bucket, folder, fileName, fileType, expiresIn = 3600) {
        const params = {
            Bucket: bucket,
            Key: `${folder}/${fileName}`,
            ContentType: fileType,
            Expires: expiresIn
        };

        try {
            const url = await s3.getSignedUrlPromise('putObject', params);
            this._logOperation('GENERATE_UPLOAD_URL', { bucket, folder, fileName, fileType });
            return url;
        } catch (error) {
            this._logOperation('GENERATE_UPLOAD_URL_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Валидация файла перед загрузкой
     * @param {Object} file - Объект файла
     * @param {string} fileType - Тип контента (image/audio/video)
     */
    static validateFile(file, fileType) {
        // Проверка типа файла
        const allowedTypes = VALIDATION_CONFIG.ALLOWED_TYPES[fileType];
        if (!allowedTypes || !allowedTypes.includes(file.mimetype)) {
            throw new Error(`Недопустимый тип файла. Разрешены: ${allowedTypes.join(', ')}`);
        }

        // Проверка размера файла
        if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
            throw new Error(`Файл слишком большой. Максимальный размер: ${VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }

        // Проверка расширения файла
        const ext = path.extname(file.originalname).toLowerCase().substring(1);

        // Для изображения, допустимы и .jpg, и .jpeg
        const validExts = allowedTypes.map((t) => t.split('/')[1]);
        if (!validExts.includes(ext) && !(ext === 'jpg' && validExts.includes('jpeg'))) {
            throw new Error(`Недопустимое расширение файла. Разрешены: ${validExts.join(', ')}`);
        }

        this._logOperation('FILE_VALIDATION_SUCCESS', {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size
        });
    }

    /**
     * Загрузка файла с валидацией
     * @param {Object} file - Объект файла
     * @param {string} fileType - Тип контента (image/audio/video)
     */
    static async uploadFileWithValidation(file, fileType) {
        try {
            // Валидация файла
            this.validateFile(file, fileType);

            // Генерация уникального имени файла
            const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

            // Автоматический выбор папки
            let folder = 'others';
            if (fileType === 'image') folder = 'images';
            else if (fileType === 'video') folder = 'videos';
            else if (fileType === 'audio') folder = 'audio';

            // Загрузка в S3
            const uploadParams = {
                Bucket: process.env.SELECTEL_BUCKET,
                Key: `${folder}/${fileName}`,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read' // <-- это важно
            };

            console.log('Тип объекта s3:', typeof s3); // Должно вывести "object"
            console.log('Методы и свойства объекта s3:', Object.keys(s3)); // Покажет все методы и свойства

            // Важно: используйте объект `s3.upload` с коллбеком или промисом
            // Загрузка в S3 (используем Promise, а не callback)
            const uploadData = await s3.upload(uploadParams).promise();

            this._logOperation('FILE_UPLOAD_SUCCESS', {
                fileName,
                fileType: file.mimetype,
                url: uploadData.Location
            });

            return {
                folder, // <-- добавляем папку
                fileName, // <-- добавляем имя файла
                fileType, // <-- тип, который пришёл на входе (image/audio/video)
                url: uploadData.Location // можно оставить, если вдруг пригодится
            };
        } catch (error) {
            this._logOperation('FILE_UPLOAD_ERROR', {
                error: error.message,
                fileName: file.originalname
            });
            throw error;
        }
    }

    /**
     * Логирование операций
     * @param {string} action - Тип действия
     * @param {Object} data - Данные для логирования
     */
    static _logOperation(action, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            ...data
        };

        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
        console.log(`[S3 Operation] ${action}`, data);
    }

    /**
     * Удаление файла из S3
     * @param {string} folder - Папка в S3
     * @param {string} fileName - Имя файла
     */
    static async deleteFileFromS3(folder, fileName) {
        if (!folder || !fileName) {
            console.log('Не переданы папка или имя файла');
            return;
        }

        const params = {
            Bucket: process.env.SELECTEL_BUCKET, // Название бакета
            Key: `${folder}/${fileName}` // Путь к файлу в S3
        };

        try {
            // Удаляем файл
            await s3.deleteObject(params).promise();
            console.log(`Файл ${folder}/${fileName} успешно удален из S3`);
        } catch (error) {
            console.error(`Ошибка при удалении файла ${folder}/${fileName}:`, error);
        }
    }
}

module.exports = FileService;
