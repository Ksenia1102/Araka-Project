<script setup>
import axios from 'axios'; // Импорт библиотеки axios для работы с HTTP-запросами
import { onUnmounted, ref } from 'vue'; // Импорт функций ref и onUnmounted
import { useRouter } from 'vue-router'; // Импорт функции для навигации между маршрутами

const router = useRouter(); // Создаем экземпляр маршрутизатора
const apiUrl = import.meta.env.VITE_API_URL;

// Функция для перехода на страницу логина
function goToLogin() {
    router.push({ name: 'login' }); // Редирект на маршрут с именем 'login'
}

const login = ref(''); // Реактивная переменная для логина
const email = ref(''); // Реактивная переменная для почты
const password = ref(''); // Реактивная переменная для пароля
const verificationCode = ref(''); // Реактивная переменная для кода подтверждения
const errors = ref({ login: '', email: '', password: '', verificationCode: '' }); // Состояние для ошибок валидации
const isCodeSent = ref(false); // Реактивное состояние для отображения поля и кнопки подтверждения
const isLoading = ref(false); // Реактивное состояние для отслеживания загрузки
const isResendDisabled = ref(false); // Реактивное состояние для блокировки кнопки повторной отправки
const resendTimeout = ref(null); // Реактивное состояние для хранения таймера
const countdown = ref(0); // Реактивное состояние для отслеживания оставшегося времени

// Функция для валидации почты
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Функция для запуска таймера
function startResendTimer() {
    isResendDisabled.value = true; // Блокируем кнопку
    countdown.value = 60; // Устанавливаем таймер на 60 секунд

    resendTimeout.value = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
            clearInterval(resendTimeout.value);
            isResendDisabled.value = false; // Разблокируем кнопку
        }
    }, 1000);
}

// Функция для регистрации пользователя
async function registerUser() {
    errors.value.login = '';
    errors.value.email = '';
    errors.value.password = '';

    // Проверка на пустые поля
    if (!login.value) {
        errors.value.login = 'Пожалуйста, заполните логин';
    }
    if (!email.value) {
        errors.value.email = 'Пожалуйста, заполните почту';
    } else if (!validateEmail(email.value)) {
        errors.value.email = 'Пожалуйста, введите корректный адрес почты';
    }
    if (!password.value) {
        errors.value.password = 'Пожалуйста, заполните пароль';
    }

    // Если есть ошибки, прекратить выполнение
    if (errors.value.login || errors.value.email || errors.value.password) {
        return;
    }

    isLoading.value = true; // Начинаем загрузку

    try {
        // Отправляем POST-запрос на сервер с логином, почтой и паролем
        const response = await axios.post(`${apiUrl}/registration/register`, {
            login: login.value,
            email: email.value,
            password: password.value,
        });
        console.log('User registered:', response.data);

        // Устанавливаем isCodeSent в true, чтобы показать поле и кнопку подтверждения
        isCodeSent.value = true;

        // Запускаем таймер для кнопки повторной отправки
        startResendTimer();

        // Сообщение о необходимости подтверждения почты
        alert('Код подтверждения отправлен на вашу почту. Пожалуйста, проверьте почту.');
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.response && error.response.status === 400) {
            if (error.response.data === 'Логин уже занят') {
                errors.value.login = 'Логин уже занят';
            } else if (error.response.data === 'Почта уже занята') {
                errors.value.email = 'Почта уже занята';
            }
        } else {
            alert('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
        }
    } finally {
        isLoading.value = false; // Завершаем загрузку
    }
}

// Функция для проверки кода подтверждения
async function verifyCode() {
    if (!verificationCode.value) {
        errors.value.verificationCode = 'Пожалуйста, введите код подтверждения';
        return;
    }

    try {
        const response = await axios.post(`${apiUrl}/registration/verify-code`, {
            email: email.value,
            code: verificationCode.value,
        });
        console.log('Email verified:', response.data);

        // Редирект на страницу логина после успешного подтверждения
        router.push({ name: 'login' });
    } catch (error) {
        console.error('Error verifying code:', error);
        alert('Неверный код подтверждения. Пожалуйста, попробуйте снова.');
    }
}

// Функция для отправки кода подтверждения
async function sendVerificationCode() {
    errors.value.email = '';

    // Проверка на пустую почту
    if (!email.value) {
        errors.value.email = 'Пожалуйста, заполните почту';
        return;
    }

    try {
        // Отправляем POST-запрос на сервер для отправки кода подтверждения
        const response = await axios.post(`${apiUrl}/registration/send-code`, {
            email: email.value,
        });
        console.log('Код отправлен:', response.data);

        // Запускаем таймер для кнопки повторной отправки
        startResendTimer();

        // Сообщение пользователю
        alert('Код подтверждения отправлен на вашу почту. Пожалуйста, проверьте почту.');
    } catch (error) {
        console.error('Ошибка при отправке кода:', error);
        alert('Ошибка при отправке кода. Пожалуйста, попробуйте снова.');
    }
}

// Очистка таймера при размонтировании компонента
onUnmounted(() => {
    if (resendTimeout.value) {
        clearInterval(resendTimeout.value);
    }
});
</script>

<template>
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
                        <!-- Поле для логина -->
                        <label for="login1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">
                            Логин
                            <span class="text-red-500">*</span>
                        </label>
                        <p v-if="errors.login" class="text-red-500 text-sm">{{ errors.login }}</p>
                        <InputText id="login1" type="text" placeholder="Логин" class="w-full md:w-[30rem] mb-8" v-model="login" />

                        <!-- Поле для почты -->
                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">
                            Почта
                            <span class="text-red-500">*</span>
                        </label>
                        <p v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</p>
                        <InputText id="email" type="email" placeholder="Почта" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <!-- Поле для пароля (скрывается после отправки кода) -->
                        <div v-if="!isCodeSent">
                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">
                                Пароль
                                <span class="text-red-500">*</span>
                            </label>
                            <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
                            <Password id="password1" v-model="password" placeholder="Пароль" :toggleMask="true" class="mb-2" fluid :feedback="false"></Password>
                        </div>

                        <!-- Поле для кода подтверждения (появляется после регистрации) -->
                        <div v-if="isCodeSent">
                            <label for="verificationCode" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">
                                Код подтверждения
                                <span class="text-red-500">*</span>
                            </label>
                            <p v-if="errors.verificationCode" class="text-red-500 text-sm">{{ errors.verificationCode }}</p>
                            <InputText id="verificationCode" type="text" placeholder="Код подтверждения" class="w-full md:w-[30rem] mb-8" v-model="verificationCode" />
                        </div>

                        <!-- Кнопки -->
                        <Button :to="{ name: 'login' }" label="Уже есть аккаунт" class="w-full" severity="secondary" text @click="goToLogin"></Button>

                        <!-- Кнопка "Зарегистрироваться" (скрывается после отправки кода) -->
                        <Button v-if="!isCodeSent" label="Зарегистрироваться" class="w-full" @click="registerUser" severity="info" :disabled="isLoading">
                            <span v-if="isLoading">Отправляем код на почту...</span>
                            <span v-else>Зарегистрироваться</span>
                        </Button>

                        <!-- Кнопка подтверждения кода (появляется после регистрации) -->
                        <Button v-if="isCodeSent" label="Подтвердить код" class="w-full" @click="verifyCode" severity="info"></Button>

                        <!-- Кнопка "Запросить код повторно" (появляется после отправки кода) -->
                        <Button v-if="isCodeSent" label="Запросить код повторно" class="w-full mt-4" @click="sendVerificationCode" severity="secondary" :disabled="isResendDisabled">
                            <span v-if="isResendDisabled">Запросить код повторно ({{ countdown }} сек)</span>
                            <span v-else>Запросить код повторно</span>
                        </Button>
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