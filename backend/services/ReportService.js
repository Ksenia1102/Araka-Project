const { TakenQuestionAnswer, TakenQuestion, TakenSurvey, Question, Student, Class, Survey } = require('../models');

exports.getDataForReport = async (classId, surveyId, gradingSystems) => {
    // Получаем название класса
    const classData = await Class.findByPk(classId);
    if (!classData) throw new Error(`Класс с id=${classId} не найден`);

    // Получаем название теста
    const surveyData = await Survey.findByPk(surveyId);
    if (!surveyData) throw new Error(`Тест с id=${surveyId} не найден`);

    const answers = await TakenQuestionAnswer.findAll({
        include: [
            {
                model: TakenQuestion,
                as: 'takenQuestion',
                required: true,
                include: [
                    {
                        model: TakenSurvey,
                        as: 'takenSurvey',
                        where: { survey_id: surveyId, class_id: classId },
                        attributes: []
                    },
                    {
                        model: Question,
                        as: 'question',
                        attributes: ['correct_option']
                    }
                ]
            },
            {
                model: Student,
                as: 'student',
                attributes: ['id', 'name', 'aruco_num'],
                required: true
            }
        ]
    });

    const studentsMap = new Map();

    for (const entry of answers) {
        const studentId = entry.student.id;
        const isCorrect = entry.answer === entry.takenQuestion.question.correct_option;

        if (!studentsMap.has(studentId)) {
            studentsMap.set(studentId, {
                aruco_num: String(entry.student.aruco_num || entry.student.id),
                name: entry.student.name,
                answers: []
            });
        }

        studentsMap.get(studentId).answers.push(isCorrect);
    }
    return {
        class_name: classData.title, // <- настоящее название класса
        date: new Date().toLocaleDateString('ru-RU'),
        test_name: surveyData.title, // <- настоящее название теста
        grading_system: gradingSystems,
        students_data: [...studentsMap.values()]
    };
};

exports.getDataForStudentReport = async (classId, studentId) => {
    const student = await Student.findOne({
        where: {
            aruco_num: studentId,
            class_id: classId // здесь фильтр по классу
        },
        include: [{ model: Class, as: 'class', attributes: ['title'] }]
    });

    if (!student) throw new Error('Студент не найден');

    const answers = await TakenQuestionAnswer.findAll({
        where: { student_id: student.id },
        include: [
            {
                model: TakenQuestion,
                as: 'takenQuestion',
                include: [
                    {
                        model: Question,
                        as: 'question',
                        attributes: ['correct_option']
                    },
                    {
                        model: TakenSurvey,
                        as: 'takenSurvey',
                        include: [
                            {
                                model: Survey,
                                as: 'survey',
                                attributes: ['title']
                            }
                        ],
                        attributes: ['date']
                    }
                ]
            }
        ]
    });

    if (!answers.length) {
        throw new Error('У студента нет пройденных тестов');
    }

    const testsMap = new Map();

    for (const entry of answers) {
        const testId = entry.takenQuestion.takenSurvey.survey_id;
        const testName = entry.takenQuestion.takenSurvey.survey.title;
        const testDate = new Date(entry.takenQuestion.takenSurvey.date).toLocaleDateString('ru-RU');
        const isCorrect = entry.answer === entry.takenQuestion.question.correct_option;

        if (!testsMap.has(testId)) {
            testsMap.set(testId, {
                name: testName,
                date: testDate,
                answers: []
            });
        }

        testsMap.get(testId).answers.push(isCorrect);
    }
    console.log({
        student_name: student.name,
        class_name: student.class.title,
        date: new Date().toLocaleDateString('ru-RU'),
        students_data: [...testsMap.values()]
    });

    return {
        student_name: student.name,
        class_name: student.class.title,
        date: new Date().toLocaleDateString('ru-RU'),
        students_data: [...testsMap.values()]
    };
};
