const StudentService = require('../services/StudentService');

class StudentController {
    // Добавление студентов в класс
    static async addStudents(req, res) {
        try {
            const { class_id, students } = req.body;

            if (!class_id || !students?.length) {
                return res.status(400).json({ error: 'Требуется class_id и список студентов' });
            }

            await StudentService.addStudents(class_id, students);
            res.status(201).json({ message: 'Студенты успешно добавлены' });
        } catch (error) {
            console.error('Ошибка добавления студентов:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Получение списка студентов класса
    static async getStudents(req, res) {
        try {
            const students = await StudentService.getStudents(req.params.classId);
            res.json(students);
        } catch (error) {
            console.error('Ошибка получения студентов:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Удаление студента
    static async deleteStudent(req, res) {
        try {
            const { classId, arucoNum } = req.params;
            const deletedCount = await StudentService.deleteStudent(classId, arucoNum);

            if (deletedCount === 0) {
                return res.status(404).json({ error: 'Студент не найден' });
            }

            res.json({ message: 'Студент успешно удалён' });
        } catch (error) {
            console.error('Ошибка удаления студента:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = StudentController;
