const s3 = require('../config/s3Client');

const uploadFile = async (bucket, folder, fileName, fileContent) => {
    const uploadParams = {
        Bucket: bucket,
        Key: `${folder}/${fileName}`,
        Body: fileContent,
        ContentType: 'text/plain'
    };

    const uploadData = await s3.upload(uploadParams).promise();
    console.log(`✅ Файл успешно загружен. URL: ${uploadData.Location}`);
    return uploadData;
};

const fileExists = async (bucket, folder, fileName) => {
    const headParams = {
        Bucket: bucket,
        Key: `${folder}/${fileName}`
    };

    try {
        await s3.headObject(headParams).promise();
        console.log('✅ Файл найден в хранилище');
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            console.log('❌ Файл не найден');
            return false;
        }
        throw error;
    }
};

const getFile = async (bucket, folder, fileName) => {
    const getParams = {
        Bucket: bucket,
        Key: `${folder}/${fileName}`
    };

    const fileData = await s3.getObject(getParams).promise();
    console.log('✅ Содержимое файла:');
    console.log(`   "${fileData.Body.toString()}"`);
    return fileData;
};

const deleteFile = async (bucket, folder, fileName) => {
    const deleteParams = {
        Bucket: bucket,
        Key: `${folder}/${fileName}`
    };

    await s3.deleteObject(deleteParams).promise();
    console.log('✅ Файл успешно удален');
};

module.exports = {
    uploadFile,
    fileExists,
    getFile,
    deleteFile
};

// class FileService {
//     static async uploadFile(fileBuffer, fileName, folder = '') {
//         const fileKey = folder ? `${folder}/${fileName}` : fileName;

//         const params = {
//             Bucket: process.env.SELECTEL_BUCKET,
//             Key: fileKey,
//             Body: fileBuffer,
//             ACL: 'public-read', // или 'private' для закрытых файлов
//             ContentType: this.getMimeType(fileName)
//         };

//         const data = await s3.upload(params).promise();
//         return {
//             url: data.Location,
//             key: fileKey
//         };
//     }

//     static async deleteFile(fileKey) {
//         const params = {
//             Bucket: process.env.SELECTEL_BUCKET,
//             Key: fileKey
//         };

//         await s3.deleteObject(params).promise();
//         return true;
//     }

//     static getMimeType(filename) {
//         const ext = filename.split('.').pop().toLowerCase();
//         const types = {
//             jpg: 'image/jpeg',
//             jpeg: 'image/jpeg',
//             png: 'image/png',
//             gif: 'image/gif',
//             mp4: 'video/mp4',
//             pdf: 'application/pdf'
//         };
//         return types[ext] || 'application/octet-stream';
//     }
// }

// module.exports = FileService;
