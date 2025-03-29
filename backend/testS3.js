const s3Service = require('./services/FileService');
const { SELECTEL_BUCKET } = process.env;

// Тестовые данные
const testFile = {
    fileName: `test-${Date.now()}.txt`, // Уникальное имя файла
    fileContent: 'Тестовое содержимое файла',
    folder: 'test-folder'
};

// Простой тест без фреймворков
async function runTests() {
    console.log('=== Начало тестов S3 ===');

    try {
        // 1. Загрузка файла
        console.log('1. Загружаем файл...');
        const uploadResult = await s3Service.uploadFile(SELECTEL_BUCKET, testFile.folder, testFile.fileName, testFile.fileContent);
        console.log('Файл загружен:', uploadResult.Location);

        // 2. Проверка существования
        console.log('2. Проверяем существование файла...');
        const exists = await s3Service.fileExists(SELECTEL_BUCKET, testFile.folder, testFile.fileName);
        console.log('Файл существует:', exists);

        // 3. Чтение файла
        console.log('3. Читаем файл...');
        const fileData = await s3Service.getFile(SELECTEL_BUCKET, testFile.folder, testFile.fileName);
        console.log('Содержимое:', fileData.Body.toString());

        // 4. Удаление файла
        console.log('4. Удаляем файл...');
        await s3Service.deleteFile(SELECTEL_BUCKET, testFile.folder, testFile.fileName);
        console.log('Файл удален');

        // 5. Проверка удаления
        console.log('5. Проверяем удаление...');
        const existsAfterDelete = await s3Service.fileExists(SELECTEL_BUCKET, testFile.folder, testFile.fileName);
        console.log('Файл существует после удаления:', existsAfterDelete);

        console.log('=== Тесты успешно завершены ===');
    } catch (error) {
        console.error('!!! Ошибка при выполнении тестов:', error);
        process.exit(1);
    }
}

// Запускаем тесты
runTests();
