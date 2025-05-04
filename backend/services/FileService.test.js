// const { test, expect, afterAll } = require('@jest/globals');
// const FileService = require('./FileService');
// const s3 = require('../config/s3Client');

// // Тестовые данные
// const TEST_BUCKET = process.env.SELECTEL_BUCKET;
// const TEST_FOLDER = 'test-folder';
// const TEST_FILE = {
//     originalname: 'test-image.jpg',
//     mimetype: 'image/jpeg',
//     size: 1024, // 1KB
//     buffer: Buffer.from('test image content')
// };

// // Очистка тестовых данных после завершения
// afterAll(async () => {
//     try {
//         await s3
//             .deleteObject({
//                 Bucket: TEST_BUCKET,
//                 Key: `${TEST_FOLDER}/${TEST_FILE.originalname}`
//             })
//             .promise();
//     } catch (e) {
//         console.log('Ошибка при очистке тестовых данных:', e.message);
//     }
// });

// describe('FileService - Работа с S3', () => {
//     test('Генерация pre-signed URL для скачивания', async () => {
//         // Сначала загружаем тестовый файл
//         await s3
//             .upload({
//                 Bucket: TEST_BUCKET,
//                 Key: `${TEST_FOLDER}/${TEST_FILE.originalname}`,
//                 Body: TEST_FILE.buffer
//             })
//             .promise();

//         const url = await FileService.generatePresignedUrl(
//             TEST_BUCKET,
//             TEST_FOLDER,
//             TEST_FILE.originalname,
//             60 // 1 минута
//         );

//         console.log('✅ Сгенерированный pre-signed URL:', url);
//         expect(url).toMatch(new RegExp(`https://.*${TEST_FILE.originalname}`));
//         expect(url).toContain('X-Amz-Signature=');
//     });

//     test('Генерация pre-signed URL для загрузки', async () => {
//         const fileName = `upload-test-${Date.now()}.jpg`;
//         const url = await FileService.generateUploadUrl(
//             TEST_BUCKET,
//             TEST_FOLDER,
//             fileName,
//             'image/jpeg',
//             60 // 1 минута
//         );

//         console.log('✅ Pre-signed URL для загрузки:', url);
//         expect(url).toMatch(new RegExp(`https://.*${fileName}`));
//     });

//     test('Валидация файла - успешный сценарий', () => {
//         expect(() => {
//             FileService.validateFile(TEST_FILE, 'image');
//         }).not.toThrow();
//     });

//     test('Валидация файла - недопустимый тип', () => {
//         const invalidFile = { ...TEST_FILE, mimetype: 'application/pdf' };
//         expect(() => {
//             FileService.validateFile(invalidFile, 'image');
//         }).toThrow('Недопустимый тип файла');
//     });

//     test('Валидация файла - превышен размер', () => {
//         const largeFile = { ...TEST_FILE, size: 50 * 1024 * 1024 }; // 50MB
//         expect(() => {
//             FileService.validateFile(largeFile, 'image');
//         }).toThrow('Файл слишком большой');
//     });

//     test('Загрузка файла с валидацией', async () => {
//         const result = await FileService.uploadFileWithValidation(TEST_FILE, 'image', TEST_FOLDER);

//         console.log('✅ Файл успешно загружен:', result.url);
//         expect(result.url).toContain(TEST_FILE.originalname);
//         expect(result.key).toContain(TEST_FOLDER);
//     });
// });
