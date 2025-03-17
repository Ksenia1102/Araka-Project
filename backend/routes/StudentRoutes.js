const express = require('express');
const { createStudent, getStudentsByClass, getStudentById, updateStudent, deleteStudent } = require('../controllers/StudentController');

const router = express.Router();

router.post('/students', createStudent); //  Создать студента
router.get('/students/class/:classId', getStudentsByClass); //  Получить всех студентов класса
router.get('/students/:id', getStudentById); //  Получить одного студента
router.put('/students/:id', updateStudent); //  Обновить студента
router.delete('/students/:id', deleteStudent); //  Удалить студента

module.exports = router;
