<script setup>
// import FloatingConfigurator from '@/components/FloatingConfigurator.vue'; // Импорт компонента FloatingConfigurator
import axios from 'axios'; // Импорт библиотеки axios для работы с HTTP-запросами
import { ref } from 'vue'; // Импорт функции ref для создания реактивных переменных
import { useRouter } from 'vue-router'; // Импорт функции для навигации между маршрутами
const router = useRouter(); // Используем роутер для навигации
const apiUrl = import.meta.env.VITE_API_URL;
const login = ref(''); // Создаем реактивную переменную для логина
const password = ref(''); // Создаем реактивную переменную для пароля
const errors = ref({ login: '', password: '' }); // Состояние для ошибок валидации
const serverError = ref(''); // Состояние для сообщений об ошибках от сервера

// Функция для перехода на страницу регистрации
function goToRegistration() {
    router.push({ name: 'registration' });
}

// Функция для входа пользователя
async function loginUser() {
    errors.value.login = '';
    errors.value.password = '';
    serverError.value = ''; // Очистка предыдущих ошибок сервера

    // Проверка на пустые поля
    if (!login.value) {
        errors.value.login = 'Пожалуйста, заполните логин';
    }
    if (!password.value) {
        errors.value.password = 'Пожалуйста, заполните пароль';
    }

    // Если есть ошибки, прекратить выполнение
    if (errors.value.login || errors.value.password) {
        return;
    }

    try {
        // Отправляем POST-запрос на сервер с логином и паролем
        const response = await axios.post(
            `${apiUrl}/login/login`, // Используем правильный URL для вашего API
            {
                login: login.value,
                password: password.value
            }
        );

        // Логируем весь ответ от сервера

        // Сохраняем токен в localStorage
        const token = response.data.token;
        localStorage.setItem('authToken', token);

        // Декодируем токен и получаем userId
        //const decodedToken = jwt_decode(token); // Используем decode для декодирования токена
        // console.log('Decoded token:', decodedToken); // Логируем декодированный токен, чтобы увидеть его содержимое

        // if (decodedToken && decodedToken.id) {
        //     localStorage.setItem('userId', decodedToken.id); // Сохраняем userId в localStorage
        // }

        // // Логируем успешный ответ
        // console.log('User login successful:', decodedToken);

        // Перенаправляем на страницу с опросом
        router.push({ name: 'dashboard' }); // Или другую страницу по вашему выбору
    } catch (error) {
        console.error('Error login user:', error); // Логируем ошибку

        // Проверка, есть ли ответ от сервера
        if (error.response) {
            console.error('Error response from server:', error.response.data);
            serverError.value = error.response.data.message || 'Произошла ошибка при попытке входа';
        } else {
            serverError.value = 'Произошла ошибка при попытке входа';
        }
    }
}
</script>

<template>
    <!-- <FloatingConfigurator /> -->
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="/public/logo.png" width="60px" height="60px" style="margin: auto" alt="New Image" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">EduVision</div>
                        <span class="text-muted-color font-medium">Авторизация</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Логин</label>
                        <p v-if="errors.login" class="text-red-500 text-sm">{{ errors.login }}</p>
                        <InputText id="email1" type="text" placeholder="Логин" class="w-full md:w-[30rem] mb-8" v-model="login" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Пароль</label>
                        <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
                        <Password id="password1" v-model="password" placeholder="Пароль" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                        <p v-if="serverError" class="text-red-500 text-sm mb-4">{{ serverError }}</p>
                        <Button :to="{ name: 'registration' }" label="Нет аккаунта" class="w-full" severity="secondary" text @click="goToRegistration" />
                        <Button label="Войти" class="w-full" @click="loginUser" severity="info"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
