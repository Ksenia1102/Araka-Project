const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // По умолчанию хранит в памяти
const uploadController = require('../controllers/UploadController');

// Загрузка файла в S3 (через форму)
router.post('/upload', upload.single('file'), uploadController.uploadFile);

module.exports = router;
