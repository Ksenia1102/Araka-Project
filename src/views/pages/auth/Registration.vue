<script setup>
// import FloatingConfigurator from '@/components/FloatingConfigurator.vue'; // Импорт компонента FloatingConfigurator
import axios from 'axios'; // Импорт библиотеки axios для работы с HTTP-запросами
import { ref } from 'vue'; // Импорт функции ref для создания реактивных переменных
import { useRouter } from 'vue-router'; // Импорт функции для навигации между маршрутами

const router = useRouter(); // Создаем экземпляр маршрутизатора
const apiUrl = import.meta.env.VITE_API_URL;
// Функция для перехода на страницу логина
function goToLogin() {
    router.push({ name: 'login' }); // Редирект на маршрут с именем 'login'
}

const login = ref(''); // Создаем реактивную переменную для логина
const password = ref(''); // Создаем реактивную переменную для пароля
const errors = ref({ login: '', password: '' }); // Состояние для ошибок валидации
// Функция для регистрации пользователя
async function registerUser() {
    errors.value.login = '';
    errors.value.password = '';

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
        const response = await axios.post(`${apiUrl}/registration/register`, {
            login: login.value,
            password: password.value
        });
        console.log('User registered:', response.data);

        // Редирект на страницу логина после успешной регистрации
        router.push({ name: 'login' });
    } catch (error) {
        console.error('Error registering user:', error);
        alert('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
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
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to EduVision!</div>
                        <span class="text-muted-color font-medium">Регистрация</span>
                    </div>
                    <div>
                        <label for="login1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">
                            Логин
                            <span class="text-red-500">*</span>
                        </label>
                        <p v-if="errors.login" class="text-red-500 text-sm">{{ errors.login }}</p>
                        <InputText id="login1" type="text" placeholder="Логин" class="w-full md:w-[30rem] mb-8" v-model="login" />
                        <!-- Сообщение об ошибке -->

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"> Пароль <span class="text-red-500">*</span> </label>
                        <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
                        <Password id="password1" v-model="password" placeholder="Пароль" :toggleMask="true" :class="{ 'border-red-500': errors.password }" class="mb-2" fluid :feedback="false"></Password>
                        <!-- Сообщение об ошибке -->

                        <Button :to="{ name: 'login' }" label="Уже есть аккаунт" class="w-full" severity="secondary" text @click="goToLogin"></Button>

                        <Button label="Зарегистрироваться" class="w-full" @click="registerUser" severity="info"></Button>
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
