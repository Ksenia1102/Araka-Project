// // Импортируем модуль express для создания сервера
// const express = require('express');

// // Импортируем bodyParser для обработки JSON-данных из тела запросов
// const bodyParser = require('body-parser');
// const jwt = require('jsonwebtoken');
// // Импортируем dotenv для работы с переменными окружения
// const dotenv = require('dotenv');

// // Импортируем маршруты для  всего
// const registrationRoutes = require('./routes/registration');
// const loginRoutes = require('./routes/login');
// const surveyRoutes = require('./routes/surveys');
// const surveyRoutes1 = require('./routes/get_surveys');
// const questionsRoutes = require('./routes/get_questions');
// const downloadCardsRoutes = require('./routes/download_cards');
// const downloadCardsRoutes1 = require('./routes/download_cards_1');
// const profileRoutes = require('./routes/profile');
// const createClassRouter = require('./routes/classes');
// const saveStudentsRouter = require('./routes/students');
// const quizRouter = require('./routes/quiz');

// const cors = require('cors'); // Импортируем CORS для обеспечения кросс-доменных запросов

// // Загрузка переменных окружения из файла .env
// dotenv.config({ path: '../backend/.env' });

// const app = express(); // Создаем экземпляр express-приложения
// app.use(bodyParser.json()); // Настраиваем обработку запросов с телом в формате JSON
// app.use(cors()); // Включаем CORS для разрешения запросов с других доменов

// /// Middleware для декодирования JWT
// const jwtMiddleware = (req, res, next) => {
//     const token = req.headers['token']; // Получаем токен из заголовков
//     if (!token) {
//         return res.status(401).send('Token not provided');
//     }

//     jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//         // Верификация токена
//         if (err) {
//             return res.status(401).send('Invalid or expired token');
//         }
//         req.decodedToken = decoded; // Добавляем декодированные данные в объект запроса
//         next(); // Переходим к следующему middleware или маршруту
//     });
// };

// app.use('/api', jwtMiddleware);

// // Подключаем маршруты для обработки запросов по пути /registration
// app.use('/registration', registrationRoutes);
// app.use('/login', loginRoutes);
// app.use('/api/surveys', surveyRoutes);
// app.use('/api', surveyRoutes1);
// app.use('/api', questionsRoutes);
// app.use('/api', downloadCardsRoutes);
// app.use('/api', profileRoutes);
// app.use('/cards', downloadCardsRoutes1);
// app.use('/api', createClassRouter);
// app.use('/api', saveStudentsRouter);
// app.use('/api', quizRouter);

// // Запуск сервера на порту 3000
// //
// const PORT = process.env.APP_PORT || 3000;
// const HOST = process.env.APP_HOST;
// console.log(PORT, HOST);

// app.listen(PORT, () => {
//     console.log(`Server running on http://${HOST}:${PORT}`);
// });

// module.exports = app;
//app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authMiddleware = require('./middlewares/authMiddleware');
const routes = require('./routes'); // Импортируем маршруты
const userRoutes = require('./routes/UserRoutes');
const classRoutes = require('./routes/ClassRoutes');
const studentRoutes = require('./routes/StudentRoutes');
const surveyRoutes = require('./routes/SurveyRoutes');
// const questionRoutes = require('./routes/QuestionRoutes');
// const optionRoutes = require('./routes/OptionRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/FolderRoutes');
const profileRoutes = require('./routes/profileRoutes');
const conductRoutes = require('./routes/conducting');
const upload = require('./routes/upload');
const downloadCardsRoutes1 = require('./routes/download_cards_1');
const chartsRoutes = require('./routes/ChartsRoutes');
const app = express();

app.use(cors()); // Настроим CORS
app.use(bodyParser.json()); // Разбираем JSON
app.use('/api', authMiddleware); // Добавляем middleware для защиты API
app.use('/api', routes); // Подключаем все маршруты
app.use('/api', userRoutes); // Все маршруты, связанные с пользователями, начинаются с /api
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes); // Добавляем новые роуты
app.use('/api/surveys', surveyRoutes);
app.use('/api', upload); // Подключаем маршруты опросов
// app.use('/api', questionRoutes); // Подключаем маршруты вопросов
// app.use('/api', optionRoutes); // Подключаем маршруты вариантов ответа
app.use('/cards', downloadCardsRoutes1);
app.use('/charts', chartsRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/api', fileRoutes);
app.use('/api/conducting', conductRoutes);
app.use('/api/folders', folderRoutes);
app.use(errorHandler); // Подключаем в конце!
module.exports = app;
