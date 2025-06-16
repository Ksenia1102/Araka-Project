const PDFDocument = require('pdfkit');
// const fs = require('fs');
const path = require('path');

// Регистрация шрифтов (если нужно, укажи свои пути)
const fontDir = __dirname;
const fontPaths = {
    Helvetica: path.join(fontDir, 'Helvetica.ttf'),
    'Helvetica-Bold': path.join(fontDir, 'Helvetica-Bold.ttf')
};

// Конвертация процентов в 5-балльную систему
function convertToFivePoint(percent) {
    if (percent < 40) return 2;
    else if (percent < 60) return 3;
    else if (percent < 80) return 4;
    else return 5;
}

// Основная функция генерации отчёта
function generateTestReport({ class_name, date, test_name, students_data, grading_system }) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 1.5 * 28.35,
            left: 2 * 28.35,
            right: 2 * 28.35,
            bottom: 2 * 28.35
        }
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Переменная для отслеживания текущей позиции Y
    let currentY = doc.y;

    // Функция для проверки и добавления новой страницы
    const checkPageBreak = (requiredHeight) => {
        const availableHeight = doc.page.height - doc.page.margins.bottom - currentY;
        if (requiredHeight > availableHeight) {
            addFooter(); // Добавляем футер перед новой страницей
            doc.addPage();
            currentY = doc.page.margins.top;
            return true;
        }
        return false;
    };

    // Функция добавления футера
    const addFooter = () => {
        const footerText = `Дата формирования отчёта: ${date}`;
        const footerFontSize = 10;

        doc.save()
            .font(fontPaths.Helvetica)
            .fontSize(footerFontSize)
            .text(footerText, doc.page.width - doc.page.margins.right - doc.widthOfString(footerText), doc.page.height - doc.page.margins.bottom - 15, { align: 'right' })
            .restore();
    };

    // Заголовок
    doc.font(fontPaths['Helvetica-Bold']).fontSize(16).text(`Отчёт по успеваемости класса ${class_name}`, {
        align: 'center'
    });
    doc.moveDown(0.2);
    doc.font(fontPaths['Helvetica-Bold']).fontSize(16).text(`Тест «${test_name}»`, {
        align: 'center'
    });
    doc.moveDown(0.2);
    currentY = doc.y;

    // Разделительная линия
    doc.moveTo(2 * 28.35, currentY)
        .lineTo(2 * 28.35 + 17 * 28.35, currentY)
        .stroke();
    doc.moveDown(0.5);
    currentY = doc.y;

    // Вычисляем score для каждого ученика
    students_data.forEach((student) => {
        if (!student.score) {
            const correctAnswers = student.answers.filter(Boolean).length;
            const totalQuestions = student.answers.length;
            student.score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        }
    });

    // Средняя оценка
    const avgScore = students_data.reduce((sum, student) => sum + student.score, 0) / students_data.length;
    doc.font(fontPaths.Helvetica)
        .fontSize(12)
        .text(`Средняя оценка по классу — ${avgScore.toFixed(1)}%`);
    doc.moveDown(1);
    currentY = doc.y;

    // Сортируем учеников по номеру
    const sortedStudents = [...students_data].sort((a, b) => parseInt(a.aruco_num) - parseInt(b.aruco_num));

    // Заголовки таблицы
    const headers = ['№', 'Ученики', 'Ответы'];
    if (grading_system.includes('percent')) headers.push('Оценка (%)');
    if (grading_system.includes('five-point')) headers.push('Оценка (5-балльная)');

    // Настройки таблицы
    const colWidths = [1 * 28.35, 5.3 * 28.35, 5 * 28.35];
    if (grading_system.includes('five-point') && grading_system.length === 1) {
        colWidths.push(3.4 * 28.35);
    } else {
        if (grading_system.includes('percent')) colWidths.push(2.6 * 28.35);
        if (grading_system.includes('five-point')) colWidths.push(3.0 * 28.35);
    }

    // Высота строки таблицы
    const rowHeight = 28;
    const headerHeight = rowHeight;

    // Проверяем, поместится ли таблица
    const tableHeight = headerHeight + sortedStudents.length * rowHeight;
    checkPageBreak(tableHeight);

    // Рисуем заголовки таблицы
    doc.font(fontPaths['Helvetica-Bold']).fontSize(10);
    headers.forEach((header, i) => {
        const x = 2 * 28.35 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, currentY, colWidths[i], headerHeight).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('black');
        doc.text(header, x + 5, currentY + 3, {
            width: colWidths[i] - 10,
            align: 'center',
            lineBreak: true
        });
    });
    currentY += headerHeight;

    // Рисуем данные таблицы
    doc.font(fontPaths.Helvetica).fontSize(12);
    sortedStudents.forEach((student) => {
        // Проверяем, нужно ли переносить на новую страницу
        if (checkPageBreak(rowHeight)) {
            // Если добавили новую страницу, рисуем заголовки снова
            headers.forEach((header, i) => {
                const x = 2 * 28.35 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                doc.rect(x, currentY, colWidths[i], headerHeight).fillAndStroke('#f0f0f0', '#000');
                doc.fillColor('black');
                doc.text(header, x + 5, currentY + 3, {
                    width: colWidths[i] - 10,
                    align: 'center',
                    lineBreak: true
                });
            });
            currentY += headerHeight;
        }

        const answerSymbols = student.answers.map((ans) => (ans ? '+' : '-')).join('');

        const cells = [student.aruco_num, student.name, answerSymbols];
        if (grading_system.includes('percent')) cells.push(student.score.toString());
        if (grading_system.includes('five-point')) cells.push(convertToFivePoint(student.score).toString());

        cells.forEach((cell, i) => {
            doc.rect(2 * 28.35 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, colWidths[i], rowHeight).stroke();
            doc.fillColor('black');
            doc.text(cell, 2 * 28.35 + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, currentY + 5, {
                width: colWidths[i] - 10,
                align: i === 0 || i === 1 || i === 2 ? 'left' : 'center',
                lineBreak: true
            });
        });

        currentY += rowHeight;
    });

    // Добавляем футер на последнюю страницу
    addFooter();

    doc.end();

    return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));
    });
}
module.exports = { generateTestReport };
// Пример входных данных (для теста)
/*
const testData = {
  class_name: "10-А",
  date: "11/04/2025",
  test_name: "Алгебра: Квадратные уравнения",
  grading_system: ['percent', 'five-point'],
  students_data: [
    { aruco_num: "2", name: "Хохлов Тимофей", answers: [false, true, true, false, true] },
    { aruco_num: "1", name: "Иванов Иван", answers: [true, true, false, true, false] },
    { aruco_num: "3", name: "Петров Пётр", answers: [true, true, true, true, true] },
    { aruco_num: "5", name: "Сидорова Анна", answers: [false, true, false, true, false] },
    { aruco_num: "4", name: "Кузнецов Алексей", answers: [true, false, true, false, true] }
  ],
  output_filename: "test_report.pdf"
};
generateTestReport(testData).then(() => console.log("PDF создан!"));
*/
