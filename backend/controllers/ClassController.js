const ClassService = require('../services/ClassService');

class ClassController {
    static async create(req, res) {
        try {
            const { title } = req.body;
            const classId = await ClassService.createClass(req.user.id, title);
            console.log({ classId, title });
            res.status(201).json({ classId, title });
            return {};
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByUser(req, res) {
        try {
            const classes = await ClassService.getClassesByUser(req.user.id);
            res.json(classes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getDetails(req, res) {
        try {
            const classData = await ClassService.getClassDetails(req.params.classId);
            if (!classData) return res.status(404).json({ error: 'Class not found' });
            res.json(classData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getRecentSurveys(req, res) {
        try {
            const surveys = await ClassService.getRecentSurveys(req.params.classId);
            res.json(surveys);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ClassController;
