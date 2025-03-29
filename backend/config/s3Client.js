// config.js
require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');

// Проверка переменных окружения
const requiredEnvVars = ['SELECTEL_ENDPOINT', 'SELECTEL_BUCKET', 'SELECTEL_ACCESS_KEY', 'SELECTEL_SECRET_KEY', 'SELECTEL_REGION', 'SSL_CA_PATH'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Ошибка: Переменная окружения ${envVar} не определена`);
        process.exit(1);
    }
}

// Инициализация S3 клиента
const s3 = new AWS.S3({
    endpoint: process.env.SELECTEL_ENDPOINT,
    accessKeyId: process.env.SELECTEL_ACCESS_KEY,
    secretAccessKey: process.env.SELECTEL_SECRET_KEY,
    region: process.env.SELECTEL_REGION,
    s3ForcePathStyle: false,
    signatureVersion: 'v4',
    httpOptions: {
        agent: new require('https').Agent({
            ca: fs.readFileSync(process.env.SSL_CA_PATH)
        })
    }
});

module.exports = s3;
