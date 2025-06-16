// const { spawn } = require('child_process');
// const path = require('path');
// const fs = require('fs');
const ReportService = require('../services/ReportService');
const { generateTestReport } = require('../scripts/report_class'); // экспортируй функцию из report_class.js
const { generateStudentReport } = require('../scripts/report_student');

exports.generateReport = async (req, res) => {
    const { classId, surveyId } = req.params;
    const gradingSystems = req.query.gradingSystems ? req.query.gradingSystems.split(',') : [];

    try {
        const reportData = await ReportService.getDataForReport(classId, surveyId, gradingSystems);
        console.log('gradingSystems', gradingSystems);

        const inputData = {
            ...reportData,
            grading_system: gradingSystems
        };

        const pdfBuffer = await generateTestReport(inputData); // получаем PDF как буфер

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${classId}_${surveyId}.pdf`);
        res.send(pdfBuffer);
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
