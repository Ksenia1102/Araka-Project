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

// Основная функция генерации отчёта
function generateStudentReport({ student_name, date, class_name, students_data }) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 1.5 * 28.35, // 1.5 см
            left: 2 * 28.35, // 2 см
            right: 2 * 28.35, // 2 см
            bottom: 2 * 28.35 // 2 см
        }
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Добавляем футер с датой внизу каждой страницы
    function addFooter() {
        const footerText = `Дата формирования отчёта: ${date}`;
        const textWidth = doc.widthOfString(footerText, { font: fontPaths.Helvetica, size: 10 });
        const x = doc.page.width - doc.page.margins.right - textWidth + 30;
        const y = doc.page.height - doc.page.margins.bottom - 15; // немного ниже основного текста
        doc.font(fontPaths.Helvetica).fontSize(10).fillColor('black').text(footerText, x, y);
    }

    // Заголовки (с меньшим размером, чтобы влезли)
    doc.font(fontPaths['Helvetica-Bold']).fontSize(14).fillColor('black').text(`${student_name} - отчёт об успеваемости`, { align: 'center' });
    doc.moveDown(0.2);
    doc.font(fontPaths['Helvetica-Bold']).fontSize(14).fillColor('black').text(`Класс «${class_name}»`, { align: 'center' });
    doc.moveDown(0.2);

    // Разделительная линия
    doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
    doc.moveDown(0.5);

    // Вычисляем score для каждого теста
    students_data.forEach((test) => {
        if (!test.score) {
            const correctAnswers = test.answers.filter(Boolean).length;
            const totalQuestions = test.answers.length;
            test.score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        }
    });

    // Средняя оценка
    const avgScore = students_data.reduce((sum, test) => sum + test.score, 0) / students_data.length;
    doc.font(fontPaths.Helvetica)
        .fontSize(12)
        .fillColor('black')
        .text(`Средняя оценка — ${avgScore.toFixed(1)}%`);
    doc.moveDown(1);

    // Сортируем тесты по дате (от старых к новым)
    const sortedTests = [...students_data].sort((a, b) => {
        const dateA = a.date.split('.').reverse().join('-');
        const dateB = b.date.split('.').reverse().join('-');
        return new Date(dateA) - new Date(dateB);
    });

    // Настройки таблицы (всегда показываем обе системы оценивания)
    const colWidths = [1 * 28.35, 5.3 * 28.35, 4 * 28.35, 3 * 28.35, 3.5 * 28.35];
    const headers = ['№', 'Название теста', 'Ответы', 'Оценка (%)', 'Оценка (5-балльная)'];

    const rowHeight = 30;
    const headerHeight = rowHeight;
    let startY = doc.y;

    // Проверяем, поместится ли таблица на текущей странице
    const tableHeight = headerHeight + sortedTests.length * rowHeight;
    const availableHeight = doc.page.height - doc.page.margins.bottom - startY - 20; // оставляем место под футер

    if (tableHeight > availableHeight) {
        addFooter();
        doc.addPage();
        startY = doc.page.margins.top;
    }

    // Функция отрисовки заголовков таблицы
    function drawTableHeaders(y) {
        doc.font(fontPaths['Helvetica-Bold']).fontSize(11).fillColor('black');
        headers.forEach((header, i) => {
            const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, y, colWidths[i], headerHeight).fillAndStroke('#f0f0f0', '#000');
            doc.fillColor('black');
            doc.text(header, x, y + 8, {
                width: colWidths[i],
                align: 'center' // Центрируем заголовки
            });
        });
    }

    drawTableHeaders(startY);

    // Данные таблицы
    doc.font(fontPaths.Helvetica).fontSize(12).fillColor('black');

    for (let rowIdx = 0; rowIdx < sortedTests.length; rowIdx++) {
        const test = sortedTests[rowIdx];
        let rowY = startY + headerHeight + rowIdx * rowHeight;

        // Проверяем, нужно ли переносить на новую страницу
        if (rowY + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
            // 20 для футера
            addFooter();
            doc.addPage();
            startY = doc.page.margins.top;
            drawTableHeaders(startY);
            rowY = startY + headerHeight;
            startY = rowY - headerHeight; // обновим стартовую позицию для дальнейших строк
            rowIdx--; // чтобы не пропустить эту строку, уменьшить индекс
            continue;
        }

        const answerSymbols = test.answers.map((ans) => (ans ? '+' : '-')).join('');
        const cells = [(rowIdx + 1).toString(), test.name, answerSymbols, test.score.toString(), convertToFivePoint(test.score).toString()];

        cells.forEach((cell, i) => {
            const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            const width = colWidths[i];

            doc.rect(x, rowY, width, rowHeight).stroke();
            doc.fillColor('black');

            let fontSize = 12;
            doc.font(fontPaths.Helvetica);

            // Уменьшаем шрифт, если текст не помещается
            while (doc.widthOfString(cell, { font: fontPaths.Helvetica, size: fontSize }) > width - 10 && fontSize > 6) {
                fontSize -= 1;
            }

            doc.fontSize(fontSize).text(cell, x + 5, rowY + (rowHeight - fontSize) / 2, {
                width: width - 10,
                align: i === 0 || i === 1 ? 'left' : 'center'
            });
        });
    }

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
