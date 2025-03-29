// const express = require('express');
// const router = express.Router();
// const { FileController, uploadMiddleware } = require('../controllers/FileController');

// router.post('/upload', uploadMiddleware, FileController.upload);
// router.delete('/delete', FileController.delete);

// module.exports = router;

// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const s3Controller = require('../controllers/FileController');

// Роуты для тестирования с S3
router.post('/upload', s3Controller.uploadFile);
router.get('/read', s3Controller.readFile);
router.delete('/delete', s3Controller.deleteFile);

module.exports = router;
