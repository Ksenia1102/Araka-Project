const ExcelJS = require('exceljs');

function convertToGrade(percent) {
    if (percent >= 90) return 5;
    if (percent >= 70) return 4;
    if (percent >= 50) return 3;
    return 2;
}

function getColorByPercent(percent) {
    if (percent >= 90) return 'FF008000';
    if (percent >= 70) return 'FF4CAF50';
    if (percent >= 50) return 'FFFFA500';
    return 'FFFF0000';
}

async function generateExcelReport({ class_name, date, test_name, questions, students_data, grading_system, correct_answers }) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Отчёт по тесту');
    console.log({ class_name, date, test_name, students_data, grading_system, correct_answers });

    const headers = ['№', 'Имя', 'Дата', ...questions];
    if (grading_system.includes('percent')) headers.push('Итог %');
    if (grading_system.includes('five-point')) headers.push('Оценка');

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
    });

    let totalPercent = 0;

    students_data.forEach((student, index) => {
        const answers = student.answers || [];
        const correctCount = answers.reduce((sum, ans, i) => {
            const answerStr = (ans ?? '').toString().toLowerCase();
            const correctStr = (correct_answers[i] ?? '').toString().toLowerCase();
            return answerStr === correctStr ? sum + 1 : sum;
        }, 0);
        const allAnswersEmpty = answers.every((ans) => ans === null || ans === undefined || ans === 'Нет ответа');
        let percent = null;
        let grade = null;

        if (!allAnswersEmpty) {
            percent = Math.round((correctCount / correct_answers.length) * 100);
            totalPercent += percent;
            grade = convertToGrade(percent);
        }

        const rowData = [student.aruco_num || index + 1, student.name, date, ...answers];
        if (grading_system.includes('percent')) rowData.push(percent !== null ? `${percent}%` : '');
        if (grading_system.includes('five-point')) rowData.push(grade !== null ? grade : '');

        const row = sheet.addRow(rowData);
        if (allAnswersEmpty) {
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' } // светло-серый
                };
            });
        }

        answers.forEach((ans, i) => {
            const col = 4 + i;
            const cell = row.getCell(col);
            const answerStr = (ans ?? '').toString().toLowerCase();
            const correctStr = (correct_answers[i] ?? '').toString().toLowerCase();

            if (answerStr === correctStr) {
                cell.font = { color: { argb: 'FF51C388' }, bold: true };
            } else {
                cell.font = { color: { argb: 'FFBD4141' }, bold: true };
            }
        });

        if (grading_system.includes('percent')) {
            row.getCell(headers.length - (grading_system.includes('five-point') ? 1 : 0)).font = { color: { argb: getColorByPercent(percent) }, bold: true };
        }
        if (grading_system.includes('five-point')) {
            row.getCell(headers.length).font = { color: { argb: getColorByPercent(percent) }, bold: true };
        }
    });

    const avgPercent = Math.round(totalPercent / students_data.length);
    const avgGrade = convertToGrade(avgPercent);

    const statsSheet = workbook.addWorksheet('Статистика');
    statsSheet.addRow(['Класс', 'Тест', 'Средний %', 'Средняя оценка']).font = { bold: true };
    statsSheet.addRow([class_name, test_name, `${avgPercent}%`, avgGrade]);

    // 🔥 Возвращаем файл как Buffer, а не пишем на диск
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = { generateExcelReport };
