const express = require('express');
const router = express.Router();
const ConductingController = require('../controllers/ConductingController');

router.post('/start', ConductingController.startSession);
router.post('/answers', ConductingController.saveAnswers);

module.exports = router;
