const ConductingService = require('../services/ConductingService');
const { validationResult } = require('express-validator');

class ConductingController {
    async startSession(req, res) {
        try {
            // Валидация входных данных
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { survey_id, class_id } = req.body;
            console.log(req.body);

            const result = await ConductingService.startSession(survey_id, class_id);

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            console.error('Error starting session:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }

    async saveAnswers(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { taken_survey_id, taken_question_id, answers } = req.body;

            const result = await ConductingService.saveAnswers(taken_survey_id, taken_question_id, answers);

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            console.error('Error saving answers:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
}

module.exports = new ConductingController();
