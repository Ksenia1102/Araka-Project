const express = require('express');
const router = express.Router();
const SurveyController = require('../controllers/SurveyController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/user/my', SurveyController.getUserSurveys);
router.get('/:id', SurveyController.getSurvey);
router.post('/', SurveyController.createSurvey);
router.put('/:id', SurveyController.updateSurvey);
router.post('/:survey_id/copy', SurveyController.copySurvey);
router.delete('/:survey_id', SurveyController.deleteSurvey);

module.exports = router;
