const mysql = require('mysql');

// Конфигурация подключения к базе данных
const dbConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    connectionLimit: 10, // Лимит одновременных подключений
    queueLimit: 0, // Нет ограничений на очередь запросов
    waitForConnections: true // Ожидание освобождения соединений
};

// Создаем пул соединений
const pool = mysql.createPool(dbConfig);

// Утилита для выполнения запросов с использованием Promises
const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, results) => {
            if (err) {
                console.error('Ошибка при выполнении запроса:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Проверка соединения и восстановление
const checkConnection = () => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка соединения с базой данных:', err);

            // Если соединение потеряно, пробуем восстановить его
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log('Попытка восстановления соединения...');
                setTimeout(checkConnection, 5000); // Повтор через 5 секунд
            }
        } else {
            console.log('Соединение с базой данных успешно установлено.');
            connection.release(); // Освобождаем соединение
        }
    });
};

// Начальная проверка соединения
checkConnection();

// Обработка событий пула
pool.on('error', (err) => {
    console.error('Ошибка в пуле соединений:', err);

    // Если ошибка связана с потерей соединения
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Соединение потеряно. Ожидание восстановления...');
        checkConnection();
    } else {
        throw err; // Критическая ошибка
    }
});

module.exports = { pool, queryAsync };
