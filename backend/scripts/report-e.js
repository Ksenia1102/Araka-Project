const ExcelJS = require('exceljs');

async function createReport() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Отчёт по тесту');

    const headers = ['Имя', 'Фамилия', 'Класс', 'Дата', 'Страна...', '2+2', 'Какой цвет...', 'Какой цвет...', 'Итог %', 'Оценка'];

    // Добавляем строку заголовков в первую строку листа
    const headerRow = sheet.addRow(headers);

    // Стили для заголовков — белый цвет текста на синем фоне, жирный шрифт
    headerRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0EA5E9' }
        };
    });

    // Пример данных
    const students = [
        { name: 'Иван', surname: 'Петров', class: '7А', date: '2025-06-17', answers: ['Париж', '4', 'синий', 'Зеленый'] },
        { name: 'Мария', surname: 'Сидорова', class: '7А', date: '2025-06-17', answers: ['Лондон', '5', 'голубой', 'Красный'] },
        { name: 'Алексей', surname: 'Иванов', class: '7А', date: '2025-06-17', answers: ['Париж', '4', 'голубой', 'Зеленый'] },
        { name: 'Алекс', surname: 'Станкс', class: '7А', date: '2025-06-17', answers: ['Париж', '3', 'красный', 'Зеленый'] }
    ];

    const correctAnswers = ['Париж', '4', 'синий', 'Зеленый'];

    // Функция для выбора цвета по проценту
    function getColorByPercent(percent) {
        if (percent >= 86) return 'FF008000'; // ярко-зеленый (отлично)
        if (percent >= 70) return 'FF4CAF50'; // зеленый помягче (хорошо)
        if (percent >= 50) return 'FFFFA500'; // оранжево-красный (удовлетворительно)
        return 'FFFF0000'; // красный (неудовлетворительно)
    }

    let totalPercent = 0;

    students.forEach((student) => {
        const answers = student.answers;
        let correctCount = 0;
        const rowData = [student.name, student.surname, student.class, student.date, ...answers];

        // Считаем правильные ответы
        answers.forEach((ans, i) => {
            if (ans.toLowerCase() === correctAnswers[i].toLowerCase()) {
                correctCount++;
            }
        });

        const percent = Math.round((correctCount / correctAnswers.length) * 100);
        totalPercent += percent;
        const grade = percent >= 90 ? 5 : percent >= 70 ? 4 : percent >= 50 ? 3 : 2;

        rowData.push(`${percent}%`);
        rowData.push(grade);

        const row = sheet.addRow(rowData);

        // Отмечаем правильные и неправильные ответы цветом
        answers.forEach((ans, i) => {
            const cell = row.getCell(5 + i);
            if (ans.toLowerCase() === correctAnswers[i].toLowerCase()) {
                cell.font = { color: { argb: 'FF51C388' }, bold: true }; // зелёный
            } else {
                cell.font = { color: { argb: 'FFBD4141' }, bold: true }; // красный
            }
        });

        // Окрашиваем проценты и оценки в зависимости от результата
        row.getCell(headers.length - 1).font = { color: { argb: getColorByPercent(percent) }, bold: true };
        row.getCell(headers.length).font = { color: { argb: getColorByPercent(percent) }, bold: true };
    });

    // --- Добавляем лист статистики ---
    const statsSheet = workbook.addWorksheet('Статистика');

    // Заголовки для статистики
    const statsHeaders = ['Имя', 'Фамилия', 'Процент правильных ответов', 'Оценка'];
    const statsHeaderRow = statsSheet.addRow(statsHeaders);

    statsHeaderRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0EA5E9' }
        };
    });

    // Добавляем данные по каждому ученику в статистику
    students.forEach((student) => {
        let correctCount = 0;
        student.answers.forEach((ans, i) => {
            if (ans.toLowerCase() === correctAnswers[i].toLowerCase()) correctCount++;
        });
        const percent = Math.round((correctCount / correctAnswers.length) * 100);
        const grade = percent >= 90 ? 5 : percent >= 70 ? 4 : percent >= 50 ? 3 : 2;

        const newRow = statsSheet.addRow([student.name, student.surname, `${percent}%`, grade]);

        // Получаем ячейки с процентом и оценкой
        newRow.getCell(3).font = { color: { argb: getColorByPercent(percent) }, bold: true };
        newRow.getCell(4).font = { color: { argb: getColorByPercent(percent) }, bold: true };
    });

    // Добавим строку со средней оценкой и % по классу
    const avgPercent = Math.round(totalPercent / students.length);
    let avgGrade;
    if (avgPercent >= 90) avgGrade = 5;
    else if (avgPercent >= 70) avgGrade = 4;
    else if (avgPercent >= 50) avgGrade = 3;
    else avgGrade = 2;

    statsSheet.addRow([]);
    const avgRow = statsSheet.addRow(['Среднее по классу', '', `${avgPercent}%`, avgGrade]);
    avgRow.font = { bold: true };
    avgRow.getCell(3).font = { color: { argb: getColorByPercent(avgPercent) }, bold: true };
    avgRow.getCell(4).font = { color: { argb: getColorByPercent(avgPercent) }, bold: true };

    // Записываем файл
    await workbook.xlsx.writeFile('Отчет_по_классу_excel.xlsx');
}

createReport();
