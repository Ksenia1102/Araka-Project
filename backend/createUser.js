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
<<<<<<< HEAD
            urname: 'Doe',
=======
            surname: 'Doe',
>>>>>>> ee5b91bd657e07c78d961e8fe43950aa17f8b4b5
            email: 'is@example.ru'
        });

        console.log('Пользователь создан:', user);
    } catch (error) {
        console.error('❌ Ошибка при создании пользователя:', error);
    }
}

createUser().catch((err) => console.log(err));
