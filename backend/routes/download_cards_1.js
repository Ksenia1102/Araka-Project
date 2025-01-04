const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/download', async (req, res) => {
    try {
        const filePath = path.resolve(__dirname, '../../public/files/Cards.pdf'); // Обновленный путь
        console.log(`Попытка загрузить файл: ${filePath}`);
        res.download(filePath, 'Cards.pdf', (err) => {
            if (err) {
                console.error('Ошибка при выдаче файла:', err);
                res.status(500).send('Ошибка при скачивании файла');
            }
        });
    } catch (error) {
        console.error('Ошибка сервера:', error);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;
