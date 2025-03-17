// createUser.js

const sequelize = require('./config/database'); // Импортируем sequelize
const User = require('./models/User'); // Импортируем модель

async function createUser() {
    try {
        // Проверяем подключение к базе данных
        await sequelize.authenticate();
        console.log('✅ Успешное подключение к базе данных');

        // Создаем пользователя
        const user = await User.create({
            login: 'john_doe',
            password: 'password123',
            name: 'John',
            surname: 'Doe'
        });

        console.log('Пользователь создан:', user);
    } catch (error) {
        console.error('❌ Ошибка при создании пользователя:', error);
    }
}

createUser().catch((err) => console.log(err));
