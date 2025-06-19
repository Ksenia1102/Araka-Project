const ExcelJS = require('exceljs');

async function createStudentReport() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Отчёт по ученику');

  const headers = [
    "Название теста", "Класс", "Дата",
    "Вопрос 1", "Вопрос 2", "Вопрос 3", "Вопрос 4",
    "Итог %", "Оценка"
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell(cell => {
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0EA5E9' }
    };
  });

  // Правильные ответы по каждому тесту
  const correctAnswersByTest = {
    "Тест по физике": ["Париж", "4", "синий", "Зеленый"],
    "Тест по географии": ["Париж", "4", "голубой", "Зеленый"],
    "Тест по математике": ["4", "4", "3", "2"]
  };

  // Данные студентов
  const students = [
    {
      testName: "Тест по физике",
      class: "7А",
      date: "2025-06-17",
      answers: ["Париж", "4", "синий", "Зеленый"]
    },
    {
      testName: "Тест по географии",
      class: "7А",
      date: "2025-06-17",
      answers: ["Лондон", "5", "голубой", "Красный"]
    },
    {
      testName: "Тест по математике",
      class: "7А",
      date: "2025-06-17",
      answers: ["5", "4", "3", "2"]
    },
  ];

  // Для статистики
  const stats = {};

  function getColorByPercent(percent) {
    if (percent >= 86) return 'FF008000';
    if (percent >= 70) return 'FF4CAF50';
    if (percent >= 50) return 'FFFFA500';
    return 'FFFF0000';
  }

  for (const student of students) {
    const correctAnswers = correctAnswersByTest[student.testName];
    if (!correctAnswers) continue;

    let correctCount = 0;
    const rowData = [
      student.testName,
      student.class,
      student.date,
      ...student.answers,
    ];

    student.answers.forEach((ans, i) => {
      if (ans.toLowerCase() === correctAnswers[i].toLowerCase()) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / correctAnswers.length) * 100);
    const grade = percent >= 90 ? 5 : percent >= 70 ? 4 : percent >= 50 ? 3 : 2;

    rowData.push(`${percent}%`);
    rowData.push(grade);

    const row = sheet.addRow(rowData);

    // Покраска ответов
    student.answers.forEach((ans, i) => {
      const cell = row.getCell(4 + i); // Вопросы начинаются с 4-й ячейки
      if (ans.toLowerCase() === correctAnswers[i].toLowerCase()) {
        cell.font = { color: { argb: 'FF51C388' }, bold: true };
      } else {
        cell.font = { color: { argb: 'FFBD4141' }, bold: true };
      }
    });

    // Покраска процента и оценки
    row.getCell(headers.length - 1).font = { color: { argb: getColorByPercent(percent) }, bold: true };
    row.getCell(headers.length).font = { color: { argb: getColorByPercent(percent) }, bold: true };

    // Сбор статистики
    if (!stats[student.testName]) {
      stats[student.testName] = { count: 0, totalPercent: 0, totalGrade: 0 };
    }

    stats[student.testName].count++;
    stats[student.testName].totalPercent += percent;
    stats[student.testName].totalGrade += grade;
  }

  // Добавляем лист статистики
  const statsSheet = workbook.addWorksheet('Статистика');

  const statsHeaders = ["Название теста", "Средний % правильных ответов", "Средняя оценка"];
  const statsHeaderRow = statsSheet.addRow(statsHeaders);
  statsHeaderRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0EA5E9' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Добавление строк статистики с правильной окраской
  for (const [testName, data] of Object.entries(stats)) {
    const avgPercent = Math.round(data.totalPercent / data.count);
    const avgGrade = Math.round(data.totalGrade / data.count);

    const row = statsSheet.addRow([testName, `${avgPercent}%`, avgGrade]);

    const color = getColorByPercent(avgPercent); // Раскраска по среднему проценту
    row.getCell(2).font = { color: { argb: color }, bold: true }; // средний %
    row.getCell(3).font = { color: { argb: color }, bold: true }; // средняя оценка
  }
  await workbook.xlsx.writeFile('Отчет_по_студенту_excel.xlsx');
}

createStudentReport();
