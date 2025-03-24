//services/ClassService.js
const { Class, Student } = require('../models');

class ClassService {
    // Получение класса с учениками
    static async getClass(classId) {
        return await Class.findByPk(classId, {
            include: [
                {
                    model: Student,
                    attributes: ['aruco_num', 'name']
                }
            ]
        });
    }
}

module.exports = ClassService;
