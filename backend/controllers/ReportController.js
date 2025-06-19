// const { spawn } = require('child_process');
// const path = require('path');
// const fs = require('fs');
const ReportService = require('../services/ReportService');
const { generateTestReport } = require('../scripts/report_class'); // экспортируй функцию из report_class.js
const { generateExcelReport } = require('../scripts/report-excel'); // или ../scripts/report_class_excel.js

const { generateStudentReport } = require('../scripts/report_student');

exports.generateReport = async (req, res) => {
    const { classId, surveyId } = req.params;
    const gradingSystems = req.query.gradingSystems ? req.query.gradingSystems.split(',') : [];
    const format = req.query.format;

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
        reportData = await ReportService.getDataForPDFReport(classId, surveyId, gradingSystems);
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
    const gradingSystems = req.query.gradingSystems ? req.query.gradingSystems.split(',') : [];

    try {
        const reportData = await ReportService.getDataForStudentReport(classId, studentId);

        const inputData = {
            ...reportData,
            grading_system: gradingSystems
        };

        const pdfBuffer = await generateStudentReport(inputData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student_report_${studentId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Ошибка в generateStudentReport:', error);
        res.status(500).json({ message: 'Ошибка при создании отчета' });
    }
};
