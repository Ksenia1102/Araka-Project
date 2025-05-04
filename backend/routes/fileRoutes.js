// const express = require('express');
// const router = express.Router();
// const { FileController, uploadMiddleware } = require('../controllers/FileController');

// router.post('/upload', uploadMiddleware, FileController.upload);
// router.delete('/delete', FileController.delete);

// module.exports = router;

// routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const s3Controller = require('../controllers/FileController');

const upload = multer();

// Роуты для тестирования с S3
router.post('/upload', upload.single('file'), s3Controller.uploadFile);

router.get('/read', s3Controller.readFile);
router.delete('/delete', s3Controller.deleteFile);

router.post('/upload-image', upload.single('file'), s3Controller.uploadImageFromForm);

module.exports = router;
