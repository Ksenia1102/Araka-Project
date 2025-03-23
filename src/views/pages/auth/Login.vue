<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const apiUrl = import.meta.env.VITE_API_URL;

const loginOrEmail = ref('');
const password = ref('');
const errors = ref({ loginOrEmail: '', password: '' });
const serverError = ref('');

// Состояния для восстановления пароля
const isPasswordReset = ref(false);
const emailForReset = ref('');
const resetCode = ref('');
const newPassword = ref('');
const resetErrors = ref({ email: '', code: '', newPassword: '' });
const isCodeSent = ref(false); // Управляет видимостью поля "Код подтверждения" и кнопки "Проверить код"
const isCodeVerified = ref(false); // Управляет видимостью поля "Новый пароль" и кнопки "Обновить пароль"
const isSendingCode = ref(false); // Реактивное состояние для отслеживания отправки кода
const isResendDisabled = ref(false); // Реактивное состояние для блокировки кнопки повторной отправки
const countdown = ref(0); // Реактивное состояние для отслеживания оставшегося времени

// Функция для перехода на страницу регистрации
function goToRegistration() {
    router.push({ name: 'registration' });
}

// Функция для входа пользователя
async function loginUser() {
    errors.value.loginOrEmail = '';
    errors.value.password = '';
    serverError.value = '';

    if (!loginOrEmail.value) {
        errors.value.loginOrEmail = 'Пожалуйста, заполните логин или почту';
    }
    if (!password.value) {
        errors.value.password = 'Пожалуйста, заполните пароль';
    }

    if (errors.value.loginOrEmail || errors.value.password) {
        return;
    }

    try {
        const response = await axios.post(`${apiUrl}/login/login`, {
            loginOrEmail: loginOrEmail.value,
            password: password.value,
        });

        const token = response.data.token;
        localStorage.setItem('authToken', token);
        router.push({ name: 'dashboard' });
    } catch (error) {
        console.error('Error login user:', error);
        if (error.response) {
            serverError.value = error.response.data.message || 'Произошла ошибка при попытке входа';
        } else {
            serverError.value = 'Произошла ошибка при попытке входа';
        }
    }
}

// Функция для запроса восстановления пароля
async function requestPasswordReset() {
    resetErrors.value.email = '';

    if (!emailForReset.value) {
        resetErrors.value.email = 'Пожалуйста, заполните почту';
        return;
    }

    isSendingCode.value = true; // Начинаем отправку кода

    try {
        await axios.post(`${apiUrl}/login/request-password-reset`, {
            email: emailForReset.value,
        });
        alert('Код подтверждения отправлен на вашу почту');
        isCodeSent.value = true; // Показываем поле "Код подтверждения" и кнопку "Проверить код"

        // Запускаем таймер для повторной отправки кода
        startResendTimer();
    } catch (error) {
        console.error('Error requesting password reset:', error);
        alert('Ошибка при запросе восстановления пароля');
    } finally {
        isSendingCode.value = false; // Завершаем отправку кода
    }
}

// Функция для проверки кода подтверждения
async function verifyResetCode() {
    resetErrors.value.code = '';

    if (!resetCode.value) {
        resetErrors.value.code = 'Пожалуйста, введите код подтверждения';
        return;
    }

    try {
        await axios.post(`${apiUrl}/login/verify-reset-code`, {
            email: emailForReset.value,
            code: resetCode.value,
        });
        isCodeVerified.value = true; // Показываем поле "Новый пароль" и кнопку "Обновить пароль"
    } catch (error) {
        console.error('Error verifying reset code:', error);
        alert('Неверный код подтверждения');
    }
}

// Функция для запуска таймера
function startResendTimer() {
    isResendDisabled.value = true; // Блокируем кнопку
    countdown.value = 60; // Устанавливаем таймер на 60 секунд

    const interval = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
            clearInterval(interval);
            isResendDisabled.value = false; // Разблокируем кнопку
        }
    }, 1000);
}

// Функция для отправки кода подтверждения повторно
async function sendVerificationCode() {
    resetErrors.value.email = '';

    if (!emailForReset.value) {
        resetErrors.value.email = 'Пожалуйста, заполните почту';
        return;
    }

    try {
        await axios.post(`${apiUrl}/login/request-password-reset`, {
            email: emailForReset.value,
        });
        alert('Код подтверждения отправлен на вашу почту');

        // Запускаем таймер для повторной отправки кода
        startResendTimer();
    } catch (error) {
        console.error('Error sending verification code:', error);
        alert('Ошибка при отправке кода подтверждения');
    }
}

// Функция для обновления пароля
async function updatePassword() {
    resetErrors.value.newPassword = '';

    if (!newPassword.value) {
        resetErrors.value.newPassword = 'Пожалуйста, введите новый пароль';
        return;
    }

    try {
        await axios.post(`${apiUrl}/login/reset-password`, {
            email: emailForReset.value,
            code: resetCode.value,
            newPassword: newPassword.value,
        });
        alert('Пароль успешно обновлен');

        // Автоматически нажимаем кнопку "Назад"
        goBack();
    } catch (error) {
        console.error('Error updating password:', error);
        alert('Ошибка при обновлении пароля');
    }
}

// Функция для возврата на предыдущий экран
function goBack() {
    isPasswordReset.value = false; // Сбрасываем состояние восстановления пароля
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="/public/logo.png" width="60px" height="60px" style="margin: auto" alt="New Image" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">EduVision</div>
                        <span class="text-muted-color font-medium">Авторизация</span>
                    </div>

                    <!-- Форма входа -->
                    <div v-if="!isPasswordReset">
                        <label for="loginOrEmail" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Логин или почта</label>
                        <p v-if="errors.loginOrEmail" class="text-red-500 text-sm">{{ errors.loginOrEmail }}</p>
                        <InputText id="loginOrEmail" type="text" placeholder="Логин или почта" class="w-full md:w-[30rem] mb-8" v-model="loginOrEmail" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Пароль</label>
                        <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
                        <Password id="password1" v-model="password" placeholder="Пароль" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                        <p v-if="serverError" class="text-red-500 text-sm mb-4">{{ serverError }}</p>
                        <Button :to="{ name: 'registration' }" label="Нет аккаунта" class="w-full" severity="secondary" text @click="goToRegistration" />
                        <Button label="Войти" class="w-full" @click="loginUser" severity="info"></Button>
                        <Button label="Забыли пароль?" class="w-full" @click="isPasswordReset = true" severity="secondary" text></Button>
                    </div>

                    <!-- Форма восстановления пароля -->
                    <div v-else>
                        <!-- Поле для почты -->
                        <div v-if="!isCodeSent">
                            <label for="emailForReset" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Почта</label>
                            <p v-if="resetErrors.email" class="text-red-500 text-sm">{{ resetErrors.email }}</p>
                            <InputText id="emailForReset" type="email" placeholder="Почта" class="w-full md:w-[30rem] mb-8" v-model="emailForReset" />
                        </div>

                        <!-- Поле для кода подтверждения (появляется после отправки кода) -->
                        <div v-if="isCodeSent">
                            <label for="resetCode" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Код подтверждения</label>
                            <p v-if="resetErrors.code" class="text-red-500 text-sm">{{ resetErrors.code }}</p>
                            <InputText id="resetCode" type="text" placeholder="Код подтверждения" class="w-full md:w-[30rem] mb-8" v-model="resetCode" />
                        </div>

                        <!-- Поле для нового пароля (появляется после проверки кода) -->
                        <div v-if="isCodeVerified">
                            <label for="newPassword" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Новый пароль</label>
                            <p v-if="resetErrors.newPassword" class="text-red-500 text-sm">{{ resetErrors.newPassword }}</p>
                            <Password id="newPassword" v-model="newPassword" placeholder="Новый пароль" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                        </div>

                        <!-- Кнопки -->
                        <Button label="Отправить код" class="w-full" @click="requestPasswordReset" severity="info" v-if="!isCodeSent" :disabled="isSendingCode">
                            <span v-if="isSendingCode">Отправляем...</span>
                            <span v-else>Отправить код</span>
                        </Button>

                        <!-- Кнопка "Проверить код" (появляется после отправки кода) -->
                        <Button label="Проверить код" class="w-full" @click="verifyResetCode" severity="info" v-if="isCodeSent && !isCodeVerified"></Button>

                        <!-- Кнопка "Запросить код повторно" (появляется после отправки кода и находится ниже кнопки "Проверить код") -->
                        <Button 
                            v-if="isCodeSent" 
                            label="Запросить код повторно" 
                            class="w-full mt-4" 
                            @click="sendVerificationCode" 
                            severity="secondary" 
                            :disabled="isResendDisabled"
                        >
                            <span v-if="isResendDisabled">Запросить код повторно ({{ countdown }} сек)</span>
                            <span v-else>Запросить код повторно</span>
                        </Button>

                        <!-- Кнопка "Обновить пароль" (появляется после проверки кода) -->
                        <Button label="Обновить пароль" class="w-full" @click="updatePassword" severity="info" v-if="isCodeVerified"></Button>

                        <!-- Кнопка "Назад" -->
                        <Button label="Назад" class="w-full" @click="goBack" severity="info" text></Button>
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