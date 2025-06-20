// const { spawn } = require('child_process');
// const path = require('path');
// const fs = require('fs');
const ReportService = require('../services/ReportService');
const { generateTestReport } = require('../scripts/report_class'); // экспортируй функцию из report_class.js
const { generateExcelReport } = require('../scripts/report-excel'); // или ../scripts/report_class_excel.js

const { generateStudentReport } = require('../scripts/report_student');
const { generateStudentExcelReport } = require('../scripts/report-excel-student');

exports.generateReport = async (req, res) => {
    const { classId, surveyId } = req.params;
    const gradingSystems = req.query.gradingSystems ? req.query.gradingSystems.split(',') : [];
    const format = req.query.format;
    console.log('format', format);

    try {
        let reportData;

        if (format === 'excel') {
            reportData = await ReportService.getDataForExcelReport(classId, surveyId, gradingSystems);
            const buffer = await generateExcelReport(reportData);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report_${classId}_${surveyId}.xlsx`);
            return res.send(buffer);
        }

        // по умолчанию PDF
        reportData = await ReportService.getDataForReport(classId, surveyId, gradingSystems);
        const pdfBuffer = await generateTestReport(reportData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${classId}_${surveyId}.pdf`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Ошибка в generateReport:', error);
        res.status(500).json({ message: 'Ошибка при создании отчета' });
    }
};

exports.generateStudentReport = async (req, res) => {
    const { classId, studentId } = req.params;
    // Получаем запрошенные системы оценивания или используем обе по умолчанию
    const requestedGradingSystems = req.query.gradingSystems ? req.query.gradingSystems.split(',') : [];
    // Используем запрошенные системы или обе по умолчанию, если ничего не запрошено
    const gradingSystems = requestedGradingSystems.length > 0 ? requestedGradingSystems : ['percent', 'five-point'];
    const format = req.query.format || 'pdf';
    console.log('format', format);

    try {
        // Получаем данные только один раз
        const reportData = format[0] === 'excel' ? await ReportService.getDataForStudentExcelReport(classId, studentId, gradingSystems) : await ReportService.getDataForStudentPdfReport(classId, studentId);

        if (format[0] === 'excel') {
            // Формируем данные для отчета
            const excelData = {
                ...reportData
                // Используем gradingSystems, которые мы определили выше
            };

            const buffer = await generateStudentExcelReport(reportData);

            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Generated data is not a valid Buffer');
            }

            // Создаем безопасное имя файла
            const safeName = reportData.student_name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
            const filename = `Отчет_${safeName}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            return res.send(buffer);
        }
        // Обработка PDF
        const pdfData = {
            ...reportData,
            grading_system: gradingSystems
        };
        const pdfBuffer = await generateStudentReport(pdfData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student_report_${studentId}.pdf`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Ошибка в generateStudentReport:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: error.message || 'Ошибка при создании отчета',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        }
    }
};
