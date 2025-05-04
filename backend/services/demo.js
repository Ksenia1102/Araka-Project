// const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const FileService = {
    /* Генерация pre-signed URL (пример)*/

    async generatePresignedUrl(bucket, folder, fileName) {
        const mockUrl = `https://${bucket}.s3.example.com/${folder}/${fileName}?auth=mock_signature_${uuidv4()}`;
        console.log(`🔗 Сгенерирован временный URL (действует 5 мин):\n${mockUrl}`);
        return mockUrl;
    },

    /*Валидация файла*/
    validateFile(file, fileType) {
        console.log(`\n🔍 Проверяем файл "${file.originalname}":`);

        // Проверка типа
        const validTypes = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
            audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm'],
            video: ['video/mp4', 'video/webm', 'video/x-flv', 'video/3gpp']
        };
        if (!validTypes[fileType].includes(file.mimetype)) {
            throw new Error(`Тип "${file.mimetype}" не разрешён для ${fileType}`);
        }
        console.log(`✅ Тип файла "${file.mimetype}" разрешён`);
        // Проверка размера (макс. 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`Файл слишком большой (${file.size} байт > ${maxSize} байт)`);
        }
        console.log(`✅ Размер файла (${file.size} байт) в норме`);
    },
    async uploadFileWithValidation(file, fileType, folder) {
        this.validateFile(file, fileType);
        const mockUrl = `https://s3.example.com/${folder}/${file.originalname}`;
        console.log(`\n📤 Файл загружен в S3:\n${mockUrl}`);
        return { url: mockUrl };
    }
};

async function demonstrate() {
    console.log('=== Демонстрация работы с S3 ===\n');

    const testFile = {
        originalname: 'example.jpg',
        mimetype: 'image/ret ',
        size: 2 * 1024 * 1024 // 2MB
    };

    try {
        // Пример 1: Валидация файла
        console.log('1. Валидация файла:');
        FileService.validateFile(testFile, 'image');

        // Пример 2: Загрузка с валидацией
        console.log('\n2. Загрузка файла:');
        await FileService.uploadFileWithValidation(testFile, 'image', 'uploads');

        // Пример 3: Pre-signed URL
        console.log('\n3. Генерация временной ссылки:');
        await FileService.generatePresignedUrl('my-bucket', 'documents', 'report.pdf');
    } catch (error) {
        console.error('\n❌ Ошибка:', error.message);
    }
}

demonstrate();
