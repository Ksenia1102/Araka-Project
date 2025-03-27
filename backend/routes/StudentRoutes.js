const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/StudentController');

// POST /api/students - Добавление студентов
router.post('/', StudentController.addStudents);

// GET /api/students/:classId - Получение студентов класса
router.get('/:classId', StudentController.getStudents);

// DELETE /api/students/:classId/:arucoNum - Удаление студента
router.delete('/:classId/:arucoNum', StudentController.deleteStudent);

module.exports = router;
