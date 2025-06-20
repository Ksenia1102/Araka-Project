const PDFDocument = require('pdfkit');
// const fs = require('fs');
const path = require('path');

// Регистрация шрифтов
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

function generateStudentReport({ student_name, date, class_name, students_data, grading_system = [] }) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 1.5 * 28.35,
            left: 2 * 28.35,
            right: 2 * 28.35,
            bottom: 2 * 28.35
        }
    });

    // Функция для добавления футера
    const addFooter = () => {
        const footerText = `Дата формирования отчёта: ${date}`;
        doc.font(fontPaths.Helvetica)
            .fontSize(10)
            .text(footerText, doc.page.width - doc.page.margins.right - doc.widthOfString(footerText), doc.page.height - doc.page.margins.bottom - 15, { align: 'right' });
    };

    // Заголовок отчета
    doc.font(fontPaths['Helvetica-Bold']).fontSize(14).text(`${student_name} - отчёт об успеваемости`, { align: 'center' });
    doc.moveDown(0.2);
    doc.font(fontPaths['Helvetica-Bold']).fontSize(14).text(`Класс «${class_name}»`, { align: 'center' });
    doc.moveDown(0.2);

    // Разделительная линия
    doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
    doc.moveDown(0.5);

    // Вычисляем score для каждого теста
    students_data.forEach((test) => {
        const correctAnswers = test.answers.filter(Boolean).length;
        const totalQuestions = test.answers.length;
        test.score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        test.grade = convertToFivePoint(test.score);
    });

    // Средняя оценка (если есть системы оценивания)
    if (grading_system.length > 0) {
        const avgScore = students_data.reduce((sum, test) => sum + test.score, 0) / students_data.length;
        doc.font(fontPaths.Helvetica)
            .fontSize(12)
            .text(`Средняя оценка — ${avgScore.toFixed(1)}%`);
        doc.moveDown(1);
    }

    // Сортируем тесты по дате
    const sortedTests = [...students_data].sort((a, b) => {
        const dateA = a.date.split('.').reverse().join('-');
        const dateB = b.date.split('.').reverse().join('-');
        return new Date(dateA) - new Date(dateB);
    });

    // Определяем колонки таблицы
    const columns = [
        { title: '№', width: 1 * 28.35, key: 'index', align: 'left' },
        { title: 'Название теста', width: 5.3 * 28.35, key: 'name', align: 'left' },
        { title: 'Ответы', width: 4 * 28.35, key: 'answers', align: 'left' }
    ];

    if (grading_system.includes('percent')) {
        columns.push({ title: 'Оценка (%)', width: 3 * 28.35, key: 'score', align: 'center' });
    }
    if (grading_system.includes('five-point')) {
        columns.push({ title: 'Оценка (5-балльная)', width: 3.5 * 28.35, key: 'grade', align: 'center' });
    }

    const colWidths = columns.map((col) => col.width);
    const rowHeight = 30;
    const headerHeight = rowHeight;
    let currentY = doc.y;

    // Проверяем, поместится ли таблица
    const tableHeight = headerHeight + sortedTests.length * rowHeight;
    if (tableHeight > doc.page.height - doc.page.margins.bottom - currentY - 20) {
        addFooter();
        doc.addPage();
        currentY = doc.page.margins.top;
    }

    // Рисуем заголовки таблицы
    doc.font(fontPaths['Helvetica-Bold']).fontSize(11);
    columns.forEach((col, i) => {
        const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, currentY, col.width, headerHeight).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('black');
        doc.text(col.title, x, currentY + 8, {
            width: col.width,
            align: 'center'
        });
    });
    currentY += headerHeight;

    // Рисуем данные таблицы
    doc.font(fontPaths.Helvetica).fontSize(12);
    sortedTests.forEach((test, index) => {
        // Проверяем, нужно ли переносить на новую страницу
        if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
            addFooter();
            doc.addPage();
            currentY = doc.page.margins.top;

            // Повторно рисуем заголовки на новой странице
            columns.forEach((col, i) => {
                const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                doc.rect(x, currentY, col.width, headerHeight).fillAndStroke('#f0f0f0', '#000');
                doc.fillColor('black');
                doc.text(col.title, x, currentY + 8, {
                    width: col.width,
                    align: 'center'
                });
            });
            currentY += headerHeight;
        }
        5;
        // Подготовка данных для строки
        const rowData = {
            index: (index + 1).toString(),
            name: test.name,
            answers: test.answers.map((ans) => (ans ? '+' : '-')).join(''),
            score: test.score.toString(),
            grade: test.grade.toString()
        };

        // Рисуем ячейки строки
        columns.forEach((col, i) => {
            const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, currentY, col.width, rowHeight).stroke();
            doc.fillColor('black');

            let fontSize = 12;
            const cellValue = rowData[col.key];
            while (doc.widthOfString(cellValue, { size: fontSize }) > col.width - 10 && fontSize > 6) {
                fontSize -= 1;
            }

            doc.fontSize(fontSize).text(cellValue, x + 5, currentY + (rowHeight - fontSize) / 2, {
                width: col.width - 10,
                align: col.align
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

module.exports = { generateStudentReport };
