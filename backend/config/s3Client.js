const AWS = require('aws-sdk');
const fs = require('fs');

// Инициализация S3 клиента
const s3 = new AWS.S3({
    endpoint: 'https://s3.ru-7.storage.selcloud.ru', // endpoint для Selectel
    accessKeyId: process.env.SELECTEL_ACCESS_KEY,
    secretAccessKey: process.env.SELECTEL_SECRET_KEY,
    region: 'ru-7',
    s3ForcePathStyle: true, // Используем это для совместимости с Selectel
    signatureVersion: 'v4',
    httpOptions: {
        agent: new require('https').Agent({
            ca: fs.readFileSync(process.env.SSL_CA_PATH)
        })
    }
});

// Пример данных файла
const file = {
    buffer: Buffer.from('test image content'),
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg'
};

async function uploadFile() {
    try {
        const uploadParams = {
            Bucket: process.env.SELECTEL_BUCKET,
            Key: `test-folder/${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        // Используем метод .upload() для загрузки файла
        const uploadData = await s3.upload(uploadParams).promise();
        console.log('Файл успешно загружен:', uploadData);
    } catch (error) {
        console.error('Ошибка при загрузке файла:', error.message);
    }
}

uploadFile();
module.exports = s3;
