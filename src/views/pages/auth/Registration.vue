<script setup>
import axios from 'axios';
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const apiUrl = import.meta.env.VITE_API_URL;

function goToLogin() {
    router.push({ name: 'login' });
}

const login = ref('');
const email = ref('');
const password = ref('');
const verificationCode = ref('');
const errors = ref({ 
    login: '', 
    email: '', 
    password: [], // Изменено на массив для хранения нескольких ошибок
    verificationCode: '' 
});
const isCodeSent = ref(false);
const isLoading = ref(false);
const isResendDisabled = ref(false);
const resendTimeout = ref(null);
const countdown = ref(0);

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Новая функция для валидации пароля
function validatePassword(password) {
    const passwordErrors = [];
    
    if (password.length < 8) {
        passwordErrors.push('Минимум 8 символов');
    }
    
    if (!/\d/.test(password)) {
        passwordErrors.push('Хотя бы одна цифра');
    }
    
    if (!/[a-z]/.test(password)) {
        passwordErrors.push('Хотя бы одна строчная буква');
    }
    
    if (!/[A-Z]/.test(password)) {
        passwordErrors.push('Хотя бы одна заглавная буква');
    }
    
    return passwordErrors;
}

// Обновленная функция для проверки пароля при вводе
function handlePasswordInput() {
    if (password.value) {
        errors.value.password = validatePassword(password.value);
    } else {
        errors.value.password = [];
    }
}

function startResendTimer() {
    isResendDisabled.value = true;
    countdown.value = 60;

    resendTimeout.value = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
            clearInterval(resendTimeout.value);
            isResendDisabled.value = false;
        }
    }, 1000);
}

async function registerUser() {
    // Сброс ошибок
    errors.value = { 
        login: '', 
        email: '', 
        password: validatePassword(password.value), 
        verificationCode: '' 
    };

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
        errors.value.password = ['Пожалуйста, заполните пароль'];
    }

    // Если есть ошибки, прекратить выполнение
    if (errors.value.login || errors.value.email || errors.value.password.length > 0) {
        return;
    }

    isLoading.value = true;
    try {
        const response = await axios.post(`${apiUrl}/auth/register`, {
            login: login.value,
            email: email.value,
            password: password.value
        });
        console.log('User registered:', response.data);
        isCodeSent.value = true;
        startResendTimer();
        alert('Код подтверждения отправлен на вашу почту. Пожалуйста, проверьте почту.');
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.response && error.response.status === 400) {
            if (error.response.data === 'Логин уже занят') {
                errors.value.login = 'Логин уже занят';
            } else if (error.response.data === 'Почта уже занята') {
                errors.value.email = 'Почта уже занята';
            } else if (error.response.data.error) {
                // Обработка ошибок валидации пароля с сервера
                errors.value.password = [error.response.data.error];
            }
        } else {
            alert('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
        }
    } finally {
        isLoading.value = false;
    }
}

async function verifyCode() {
    if (!verificationCode.value) {
        errors.value.verificationCode = 'Пожалуйста, введите код подтверждения';
        return;
    }

    try {
        const response = await axios.post(`${apiUrl}/auth/registration/verify-code`, {
            email: email.value,
            code: verificationCode.value
        });
        console.log('Email verified:', response.data);
        router.push({ name: 'login' });
    } catch (error) {
        console.error('Error verifying code:', error);
        alert('Неверный код подтверждения. Пожалуйста, попробуйте снова.');
    }
}

async function sendVerificationCode() {
    errors.value.email = '';

    if (!email.value) {
        errors.value.email = 'Пожалуйста, заполните почту';
        return;
    }

    try {
        const response = await axios.post(`${apiUrl}/registration/send-code`, {
            email: email.value
        });
        console.log('Код отправлен:', response.data);
        startResendTimer();
        alert('Код подтверждения отправлен на вашу почту. Пожалуйста, проверьте почту.');
    } catch (error) {
        console.error('Ошибка при отправке кода:', error);
        alert('Ошибка при отправке кода. Пожалуйста, попробуйте снова.');
    }
}

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
                            <Password 
                                id="password1" 
                                v-model="password" 
                                placeholder="Пароль" 
                                :toggleMask="true" 
                                class="mb-2" 
                                fluid 
                                :feedback="false"
                                @input="handlePasswordInput"
                            ></Password>
                            
                            <!-- Отображение ошибок пароля -->
                            <div v-if="errors.password.length > 0" class="text-red-500 text-sm mb-4">
                                <p v-for="(error, index) in errors.password" :key="index">
                                    {{ error }}
                                </p>
                            </div>
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

                        <Button :to="{ name: 'login' }" label="Уже есть аккаунт" class="w-full" severity="secondary" text @click="goToLogin"></Button>

                        <!-- Кнопка "Зарегистрироваться" (скрывается после отправки кода) -->
                        <Button 
                            v-if="!isCodeSent" 
                            label="Зарегистрироваться" 
                            class="w-full" 
                            @click="registerUser" 
                            severity="info" 
                            :disabled="isLoading || errors.password.length > 0"
                        >
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

.text-muted-color {
    color: var(--text-color-secondary);
}

/* Стиль для списка ошибок */
ul.list-disc {
    margin-top: 0.5rem;
}
</style>
