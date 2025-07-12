const express = require('express');
const router = express.Router();
const ClassController = require('../controllers/ClassController');

router.post('/', ClassController.create);
router.get('/user/my', ClassController.getByUser);
router.get('/:classId', ClassController.getDetails);
router.get('/:classId/recent-surveys', ClassController.getRecentSurveys);
router.delete('/:classId', ClassController.delete);

module.exports = router;
