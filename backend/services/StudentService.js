const { Student } = require('../models');
const { sequelize } = require('../config/database');

class StudentService {
    static async addStudents(class_id, students) {
        return await sequelize.transaction(async (t) => {
            const existingStudents = await Student.findAll({
                where: { class_id },
                attributes: ['aruco_num'],
                transaction: t
            });

            const occupiedNums = new Set(existingStudents.map((s) => s.aruco_num));

            const findFreeNum = () => {
                let num = 1;
                while (occupiedNums.has(num)) num++;
                return num;
            };

            const createdStudents = [];
            for (const student of students) {
                const aruco_num = findFreeNum();
                occupiedNums.add(aruco_num);
                try {
                    console.log(`Добавляем студента ${student.name} с артикулом ${aruco_num}`);
                    const newStudent = await Student.create(
                        {
                            class_id,
                            name: student.name,
                            aruco_num
                        },
                        { transaction: t }
                    );
                    createdStudents.push(newStudent);
                } catch (err) {
                    console.error(`Ошибка при добавлении студента ${student.name}:`, err);
                    throw new Error(`Ошибка при добавлении студента ${student.name}`);
                }
            }
            return createdStudents;
        });
    }

    static async getStudents(classId) {
        return await Student.findAll({
            where: { class_id: classId },
            attributes: ['aruco_num', 'name']
        });
    }

    static async deleteStudent(classId, arucoNum) {
        return await Student.destroy({
            where: {
                class_id: classId,
                aruco_num: arucoNum
            }
        });
    }
}

module.exports = StudentService;
