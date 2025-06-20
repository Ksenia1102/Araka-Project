const ExcelJS = require('exceljs');

async function generateStudentExcelReport({ student_name, class_name, date, students_data, grading_system }) {
    console.log('grading_system');
    console.log('grading_system', grading_system);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Отчёт по ученику');

    // Определяем максимальное количество вопросов среди всех тестов
    const maxQuestions = Math.max(...students_data.map((test) => test.answers.length));

    // Формируем заголовки
    const headers = ['Название теста', 'Класс', 'Дата'];
    for (let i = 1; i <= maxQuestions; i++) {
        headers.push(`Вопрос ${i}`);
    }
    if (grading_system.includes('percent')) headers.push('Итог %');
    if (grading_system.includes('five-point')) headers.push('Оценка');

    // Стили для заголовков
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
    });

    // Функции для расчета
    const calculateGrade = (percent) => {
        if (percent >= 90) return 5;
        if (percent >= 70) return 4;
        if (percent >= 50) return 3;
        return 2;
    };

    // Заполняем данные по тестам
    students_data.forEach((test) => {
        // Считаем правильные ответы
        const correctAnswers = test.answers.filter((answer, index) => {
            return answer?.toString().toLowerCase() === test.correct_answers?.[index]?.toString().toLowerCase();
        }).length;

        const totalQuestions = test.answers.length;
        const percent = Math.round((correctAnswers / totalQuestions) * 100);
        const grade = calculateGrade(percent);

        // Формируем строку с данными
        const rowData = [test.name, class_name, test.date];

        // Добавляем ответы с цветовой маркировкой
        test.answers.forEach((answer, i) => {
            const correctAnswer = test.correct_answers?.[i];
            const isCorrect = answer?.toString().toLowerCase() === correctAnswer?.toString().toLowerCase();
            rowData.push(answer ?? 'Нет ответа');
        });

        // Заполняем оставшиеся вопросы пустыми значениями
        for (let i = test.answers.length; i < maxQuestions; i++) {
            rowData.push('');
        }

        // Добавляем итоговые колонки
        if (grading_system.includes('percent')) rowData.push(`${percent}%`);
        if (grading_system.includes('five-point')) rowData.push(grade);

        const row = sheet.addRow(rowData);

        // Раскрашиваем ячейки с ответами
        test.answers.forEach((answer, i) => {
            const cell = row.getCell(4 + i); // 4 потому что первые 3 колонки - тест, класс, дата
            const correctAnswer = test.correct_answers?.[i];
            const isCorrect = answer?.toString().toLowerCase() === correctAnswer?.toString().toLowerCase();

            cell.font = {
                color: { argb: isCorrect ? 'FF51C388' : 'FFBD4141' },
                bold: true
            };
        });

        // Раскрашиваем итоговые колонки
        const resultColumnIndex = 3 + maxQuestions;
        if (grading_system.includes('percent')) {
            row.getCell(resultColumnIndex + 1).font = {
                color: { argb: getColorByPercent(percent) },
                bold: true
            };
        }
        if (grading_system.includes('five-point')) {
            row.getCell(resultColumnIndex + 2).font = {
                color: { argb: getColorByPercent(percent) },
                bold: true
            };
        }
    });

    // Настройка ширины столбцов
    sheet.columns.forEach((column, index) => {
        column.width = index < 3 ? 20 : index < 3 + maxQuestions ? 25 : 15;
    });

    return await workbook.xlsx.writeBuffer();
}

// Добавляем функцию для цвета по проценту
function getColorByPercent(percent) {
    if (percent >= 90) return 'FF008000';
    if (percent >= 70) return 'FF4CAF50';
    if (percent >= 50) return 'FFFFA500';
    return 'FFFF0000';
}

module.exports = { generateStudentExcelReport };
