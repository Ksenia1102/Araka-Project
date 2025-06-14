const express = require('express');
const router = express.Router();
const ConductingController = require('../controllers/ConductingController');
const ReportController = require('../controllers/ReportController');

router.post('/start', ConductingController.startSession);
router.post('/answers', ConductingController.saveAnswers);
router.get('/active', ConductingController.getActiveSurvey);
router.get('/current', ConductingController.getCurrentQuestion);
router.post('/stop', ConductingController.stopSession);
router.get('/students', ConductingController.getClassStudents);
router.get('/:classId/:surveyId/results', ConductingController.getSurveyResults);

router.get('/student/:classId/:studentId/report', ReportController.generateStudentReport);
router.get('/:classId/:surveyId/report', ReportController.generateReport);

module.exports = router;
