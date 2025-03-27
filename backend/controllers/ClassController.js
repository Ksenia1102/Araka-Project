const ClassService = require('../services/ClassService');

class ClassController {
    static async create(req, res) {
        try {
            const { user_id, title } = req.body;
            const classId = await ClassService.createClass(user_id, title);
            res.status(201).json({ classId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByUser(req, res) {
        try {
            const classes = await ClassService.getClassesByUser(req.params.userId);
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
}

module.exports = ClassController;
