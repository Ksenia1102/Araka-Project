const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ReportService = require('../services/ReportService');

exports.generateReport = async (req, res) => {
    const { classId, surveyId } = req.params;
    const gradingSystems = req.query.gradingSystems ? req.query.gradingSystems.split(',') : [];
    try {
        const reportData = await ReportService.getDataForReport(classId, surveyId, gradingSystems);
        console.log('gradingSystems', gradingSystems);

        const filename = `report_${classId}_${surveyId}_${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '..', 'tmp', filename);

        // Убедись, что директория существует
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        const inputData = {
            ...reportData,
            gradingSystems,
            output_filename: outputPath
        };

        console.log('inputData', reportData);

        const py = spawn('python', ['scripts/report_class.py']);

        py.stdout.on('data', (data) => {
            console.log('Python stdout:', data.toString());
        });

        py.stderr.on('data', (data) => {
            console.error('Python error:', data.toString());
        });

        py.stdin.write(JSON.stringify(inputData));
        py.stdin.end();

        py.stderr.on('data', (data) => {
            console.error('Python error:', data.toString());
        });

        py.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ message: 'Ошибка при генерации PDF.' });
            }

            res.download(outputPath, filename, (err) => {
                if (err) console.error('Ошибка загрузки файла:', err);
                fs.unlink(outputPath, () => {});
            });
        });
    } catch (error) {
        console.error('Ошибка в generateReport:', error);
        res.status(500).json({ message: 'Ошибка при создании отчета' });
    }
};

exports.generateStudentReport = async (req, res) => {
    const { classId, studentId } = req.params;

    try {
        const reportData = await ReportService.getDataForStudentReport(classId, studentId);

        const filename = `student_report_${studentId}_${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '..', 'tmp', filename);

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        const inputData = {
            ...reportData,
            output_filename: outputPath
        };

        const py = spawn('python', ['scripts/report_student.py']);
        py.stdin.write(JSON.stringify(inputData));
        py.stdin.end();

        py.stderr.on('data', (data) => {
            console.error('Python error:', data.toString());
        });

        py.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ message: 'Ошибка при генерации PDF.' });
            }

            res.download(outputPath, filename, (err) => {
                if (err) console.error('Ошибка загрузки файла:', err);
                fs.unlink(outputPath, () => {});
            });
        });
    } catch (error) {
        console.error('Ошибка в generateStudentReport:', error);
        res.status(500).json({ message: 'Ошибка при создании отчета' });
    }
};
