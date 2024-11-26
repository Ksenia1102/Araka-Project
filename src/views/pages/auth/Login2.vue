<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue'; // Импорт компонента FloatingConfigurator
//import axios from 'axios'; // Импорт библиотеки axios для работы с HTTP-запросами
import { ref } from 'vue'; // Импорт функции ref для создания реактивных переменных
import { useRouter } from 'vue-router'; // Импорт функции для навигации между маршрутами

const router = useRouter();
// import { useRouter } from 'vue-router';

// const router = useRouter();

// function goToDashboard() {
//     router.push({ name: 'dashboard' });
// }
// const email = ref('');
// const password = ref('');
// const checked = ref(false);

function goToRegistration() {
    router.push({ name: 'registration' });
}

const login = ref(''); // Создаем реактивную переменную для логина
const password = ref(''); // Создаем реактивную переменную для пароля
const errors = ref({ login: '', password: '' }); // Состояние для ошибок валидации
const serverError = ref(''); // Состояние для сообщений об ошибках от сервера

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

    // Получаем токен из localStorage (если он есть)
    //const token = localStorage.getItem('token');

    // try {
    //     // Отправляем POST-запрос на сервер с логином и паролем
    //     const response = await axios.post(
    //         'http://localhost:3000/login/login',
    //         {
    //             login: login.value,
    //             password: password.value
    //         },
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Передаем токен в заголовке, если он есть
    //             }
    //         }
    //     );

    //     console.log('User login:', response.data); // Логируем успешный ответ от сервера

    //     // Если вход успешен, перенаправляем на другую страницу
    //     router.push({ name: 'dashboard' });
    // } catch (error) {
    //     console.error('Error login user:', error); // Логируем ошибку

    //     // Проверка, есть ли ответ от сервера
    //     if (error.response) {
    //         console.error('Error response from server:', error.response.data); // Логируем ответ сервера
    //         serverError.value = error.response.data.message || 'Произошла ошибка при попытке входа';
    //     } else {
    //         serverError.value = 'Произошла ошибка при попытке входа';
    //     }
    // }
}

// async function fetchProtectedData() {
//     const token = localStorage.getItem('token'); // Получаем токен из localStorage

//     if (!token) {
//         serverError.value = 'Необходимо войти в систему!';
//         return;
//     }

//     try {
//         // Выполняем запрос с токеном в заголовке
//         const response = await axios.get('http://localhost:3000/protected-route', {
//             headers: {
//                 Authorization: `Bearer ${token}`
//             }
//         });

//         console.log('Protected data:', response.data);
//         // Дальше можно обработать полученные данные
//     } catch (error) {
//         console.error('Error fetching protected data:', error);
//         serverError.value = 'Ошибка при получении данных';
//     }
// }
//module.exports = fetchProtectedData;
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="/public/logo.png" width="60px" height="60px" style="margin: auto" alt="New Image" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to EduVision!</div>
                        <span class="text-muted-color font-medium">Авторизация</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Login</label>
                        <p v-if="errors.login" class="text-red-500 text-sm"></p>
                        <InputText id="email1" type="text" placeholder="Login" class="w-full md:w-[30rem] mb-8" v-model="login" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                        <p v-if="serverError" class="text-red-500 text-sm mb-4">{{ serverError }}</p>
                        <Button :to="{ name: 'registration' }" label="Нет аккаунта" class="w-full" severity="secondary" text @click="goToRegistration" />
                        <!-- <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                        </div> -->
                        <Button label="Войти" class="w-full" @click="loginUser"></Button>
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
