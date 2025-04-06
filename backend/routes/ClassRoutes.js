const express = require('express');
const router = express.Router();
const ClassController = require('../controllers/ClassController');

router.post('/', ClassController.create);
router.get('/user/my', ClassController.getByUser);
router.get('/:classId', ClassController.getDetails);

module.exports = router;
