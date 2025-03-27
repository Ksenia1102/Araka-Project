const { Class, Student } = require('../models');

class ClassService {
    static async createClass(user_id, title) {
        return await Class.create({ user_id, title });
    }

    static async getClassesByUser(userId) {
        return await Class.findAll({
            where: { user_id: userId },
            attributes: ['id', 'title'],
            include: [
                {
                    model: Student,
                    attributes: []
                }
            ],
            group: ['Class.id'],
            raw: true
        });
    }

    static async getClassDetails(classId) {
        return await Class.findByPk(classId, {
            include: [
                {
                    model: Student,
                    attributes: ['aruco_num', 'name']
                }
            ]
        });
    }

    static async getClassName(classId) {
        const cls = await Class.findByPk(classId, {
            attributes: ['title']
        });
        return cls ? cls.title : null;
    }
}

module.exports = ClassService;
