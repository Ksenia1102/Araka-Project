const { Student } = require('../models');

// 📌 Создание студента
async function createStudent(req, res) {
    try {
        const { class_id, name, aruco_num } = req.body;

        if (!class_id || !name || !aruco_num) {
            return res.status(400).json({ message: 'class_id, name и aruco_num обязательны' });
        }

        const student = await Student.create({ class_id, name, aruco_num });

        return res.status(201).json(student);
    } catch (error) {
        console.error('Ошибка при создании студента:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение всех студентов класса
async function getStudentsByClass(req, res) {
    try {
        const { classId } = req.params;
        const students = await Student.findAll({ where: { class_id: classId } });

        return res.status(200).json(students);
    } catch (error) {
        console.error('Ошибка при получении студентов:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Получение студента по ID
async function getStudentById(req, res) {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id);

        if (!student) {
            return res.status(404).json({ message: 'Студент не найден' });
        }

        return res.status(200).json(student);
    } catch (error) {
        console.error('Ошибка при получении студента:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Обновление студента
async function updateStudent(req, res) {
    try {
        const { id } = req.params;
        const { name, aruco_num } = req.body;

        const student = await Student.findByPk(id);
        if (!student) {
            return res.status(404).json({ message: 'Студент не найден' });
        }

        student.name = name || student.name;
        student.aruco_num = aruco_num || student.aruco_num;
        await student.save();

        return res.status(200).json(student);
    } catch (error) {
        console.error('Ошибка при обновлении студента:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

// 📌 Удаление студента
async function deleteStudent(req, res) {
    try {
        const { id } = req.params;

        const student = await Student.findByPk(id);
        if (!student) {
            return res.status(404).json({ message: 'Студент не найден' });
        }

        await student.destroy();

        return res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении студента:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    createStudent,
    getStudentsByClass,
    getStudentById,
    updateStudent,
    deleteStudent
};
