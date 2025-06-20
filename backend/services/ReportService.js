const { TakenQuestionAnswer, TakenQuestion, TakenSurvey, Question, Student, Class, Survey, Option } = require('../models');

exports.getDataForReport = async (classId, surveyId, gradingSystems) => {
    const classData = await Class.findByPk(classId);
    if (!classData) throw new Error(`Класс с id=${classId} не найден`);

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
    const correctAnswersByIndex = [];

    // Временное хранилище правильных ответов по порядку вопросов
    const questionOrderMap = new Map();
    let questionIndex = 0;

    for (const entry of answers) {
        const studentId = entry.student.id;
        const questionId = entry.takenQuestion.question_id;
        const correctAnswer = entry.takenQuestion.question.correct_option;
        const isCorrect = entry.answer === correctAnswer;

        if (!questionOrderMap.has(questionId)) {
            questionOrderMap.set(questionId, questionIndex++);
            correctAnswersByIndex.push(correctAnswer);
        }

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
        class_name: classData.title,
        date: new Date().toLocaleDateString('ru-RU'),
        test_name: surveyData.title,
        grading_system: gradingSystems,
        students_data: [...studentsMap.values()],
        correct_answers: correctAnswersByIndex
    };
};

exports.getDataForExcelReport = async (classId, surveyId, gradingSystems) => {
    const classData = await Class.findByPk(classId, { attributes: ['title'] });
    if (!classData) throw new Error(`Класс с id=${classId} не найден`);

    const surveyData = await Survey.findByPk(surveyId, { attributes: ['title'] });
    if (!surveyData) throw new Error(`Тест с id=${surveyId} не найден`);

    // Получаем список вопросов вместе с вариантами ответов (Options)
    const questions = await Question.findAll({
        where: { survey_id: surveyId },
        order: [['id', 'ASC']],
        include: [
            {
                model: Option, // Предполагаю, что у тебя есть модель Option
                as: 'options', // Связь: Question.hasMany(Option, {as:'options'})
                attributes: ['text'],
                order: [['id', 'ASC']]
            }
        ]
    });

    const questionMap = new Map();
    const correctAnswers = [];
    const questionTexts = [];

    questions.forEach((q, idx) => {
        // Собираем массив текстов вариантов
        const optionTexts = q.options.map((opt) => opt.text);
        questionMap.set(q.id, {
            correct_option: q.correct_option,
            index: idx,
            options: optionTexts
        });
        correctAnswers.push(optionTexts[q.correct_option] || '');
        questionTexts.push(q.text || `Вопрос ${idx + 1}`);
    });

    // Получаем ответы студентов
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
                        attributes: ['id']
                    }
                ]
            },
            {
                model: Student,
                as: 'student',
                required: true,
                attributes: ['id', 'name', 'class_id', 'aruco_num']
            }
        ]
    });

    const studentsMap = new Map();

    for (const entry of answers) {
        const student = entry.student;
        const takenQuestion = entry.takenQuestion;
        const question = takenQuestion?.question;

        if (!student || !takenQuestion || !question) continue;

        const questionId = question.id;
        const questionMeta = questionMap.get(questionId);
        if (!questionMeta) continue;

        const studentId = student.id;

        // Здесь answer - индекс выбранного варианта, надо получить текст
        const selectedIndex = parseInt(entry.answer);
        const answerText = questionMeta.options[selectedIndex] || '—';

        if (!studentsMap.has(studentId)) {
            studentsMap.set(studentId, {
                name: student.name,
                class: classData.title,
                aruco_num: student.aruco_num?.toString() || studentId.toString(),
                date: new Date().toLocaleDateString('ru-RU'),
                answers: Array(questions.length).fill('')
            });
        }

        studentsMap.get(studentId).answers[questionMeta.index] = answerText;
    }

    return {
        class_name: classData.title,
        date: new Date().toLocaleDateString('ru-RU'),
        test_name: surveyData.title,
        questions: questionTexts,
        correct_answers: correctAnswers,
        grading_system: gradingSystems,
        students_data: [...studentsMap.values()]
    };
};

exports.getDataForStudentPdfReport = async (classId, studentId, gradingSystems) => {
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

    return {
        student_name: student.name,
        class_name: student.class.title,
        date: new Date().toLocaleDateString('ru-RU'),
        students_data: [...testsMap.values()],
        grading_system: gradingSystems
    };
};

exports.getDataForStudentExcelReport = async (classId, studentId, gradingSystems) => {
    const student = await Student.findOne({
        where: {
            aruco_num: studentId,
            class_id: classId
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
                        attributes: ['id', 'correct_option'],
                        include: [
                            {
                                model: Option,
                                as: 'options',
                                attributes: ['text']
                            }
                        ]
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
                        attributes: ['date', 'survey_id']
                    }
                ]
            }
        ],
        order: [[{ model: TakenQuestion, as: 'takenQuestion' }, { model: TakenSurvey, as: 'takenSurvey' }, 'date', 'DESC']]
    });

    if (!answers.length) {
        throw new Error('У студента нет пройденных тестов');
    }

    // Группируем ответы по тестам
    const testsMap = new Map();

    answers.forEach((entry) => {
        const testId = entry.takenQuestion.takenSurvey.survey_id;
        const question = entry.takenQuestion.question;

        // Получаем текст выбранного ответа
        const selectedOptionIndex = parseInt(entry.answer);
        const selectedAnswer = question.options[selectedOptionIndex]?.text || 'Нет ответа';

        // Получаем текст правильного ответа
        const correctAnswer = question.options[question.correct_option]?.text || '';

        if (!testsMap.has(testId)) {
            testsMap.set(testId, {
                name: entry.takenQuestion.takenSurvey.survey.title,
                date: new Date(entry.takenQuestion.takenSurvey.date).toLocaleDateString('ru-RU'),
                answers: [],
                correct_answers: [] // Добавляем массив правильных ответов
            });
        }

        testsMap.get(testId).answers.push(selectedAnswer);
        testsMap.get(testId).correct_answers.push(correctAnswer);
    });

    // Преобразуем в массив и добавляем расчеты
    const testsData = Array.from(testsMap.values()).map((test) => {
        const correctCount = test.answers.reduce((count, answer, index) => {
            return answer === test.correct_answers[index] ? count + 1 : count;
        }, 0);

        const totalQuestions = test.answers.length;
        const percent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        return {
            ...test,
            correctCount,
            totalQuestions,
            percent,
            grade: convertToFivePoint(percent)
        };
    });

    return {
        student_name: student.name,
        class_name: student.class.title,
        date: new Date().toLocaleDateString('ru-RU'),
        students_data: testsData,
        grading_system: gradingSystems
    };
};
function convertToFivePoint(percent) {
    if (percent >= 90) return 5;
    if (percent >= 70) return 4;
    if (percent >= 50) return 3;
    return 2;
}
