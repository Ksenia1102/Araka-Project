const express = require('express');
const router = express.Router();
const ChartsController = require('../controllers/ChartsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/filters', authMiddleware, ChartsController.getFilterData);
router.post('/stats', authMiddleware, ChartsController.getChartStats);

module.exports = router;
