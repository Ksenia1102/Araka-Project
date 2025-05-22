<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const toast = useToast();
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
const canResendCode = ref(false); // Реактивное состояние для возможности повторной отправки кода
const resendTimer = ref(60); // Таймер для отсчета времени

// Функция для перехода на страницу регистрации
function goToRegistration() {
    router.push({ name: 'registration' });
}

// Функция для перехода на страницу регистрации
function goToCode() {
    router.push({ name: 'code' });
}

// Функция для входа пользователя
// В вашем компоненте (в секции script setup) должны быть определены эти переменные
const isLoading = ref(false);

async function loginUser() {
    // Сброс ошибок
    errors.value = {
        loginOrEmail: '',
        password: ''
    };

    // Проверка на пустые поля
    if (!loginOrEmail.value) {
        errors.value.loginOrEmail = 'Пожалуйста, заполните логин или email';
        return;
    }
    if (!password.value) {
        errors.value.password = 'Пожалуйста, заполните пароль';
        return;
    }

    try {
        isLoading.value = true;
        const response = await axios.post(`${apiUrl}/auth/login`, {
            loginOrEmail: loginOrEmail.value,
            password: password.value
        });

        console.log('User logged in:', response.data);
        const token = response.data.token;
        localStorage.setItem('authToken', token);
        router.push({ name: 'dashboard' });
    } catch (error) {
        console.error('Error logging in user:', error);

        if (error.response) {
            console.log('Full error response:', error.response.data);

            const errorData = error.response.data;
            let errorMessage = '';

            // Обработка разных форматов ошибок
            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.error) {
                errorMessage = errorData.error;
            }

            // Проверка на неподтвержденную почту (500 ошибка)
            if (error.response.status === 500 && (errorMessage.toLowerCase().includes('подтвержден') || errorMessage.toLowerCase().includes('подтвердите'))) {
                toast.add({
                    severity: 'warn',
                    summary: 'Требуется подтверждение',
                    detail: 'Пожалуйста, подтвердите вашу почту перед входом. Проверьте вашу почту для получения кода подтверждения.',
                    life: 5000
                });
                return;
            }

            // Общие ошибки авторизации
            if (error.response.status === 401 || errorMessage.toLowerCase().includes('неверный') || errorMessage.toLowerCase().includes('invalid')) {
                toast.add({
                    severity: 'error',
                    summary: 'Ошибка',
                    detail: 'Неверный пароль.',
                    life: 5000
                });
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Ошибка сервера',
                    detail: errorMessage || 'Произошла ошибка при входе',
                    life: 3000
                });
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Ошибка сети',
                detail: 'Не удалось подключиться к серверу. Проверьте соединение.',
                life: 3000
            });
        }
    } finally {
        isLoading.value = false;
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

    // Перенаправляем на страницу с опросом
    try {
        await axios.post(`${apiUrl}/auth/login/request-password-reset`, {
            email: emailForReset.value
        });
        toast.add({ severity: 'success', summary: 'Отлично!', detail: 'Код подтверждения отправлен на вашу почту. Без подтверждения аккаунта вход будет невозоможен.', life: 8000 });
        isCodeSent.value = true; // Показываем поле "Код подтверждения" и кнопку "Проверить код"

        // Запускаем таймер для повторной отправки кода
        startResendTimer();
    } catch (error) {
        // Или другую страницу по вашему выбору
        console.error('Error requesting password reset:', error);
        toast.add({ severity: 'error', summary: 'Ошибка!', detail: 'Ошибка при отправке кода.', life: 8000 });
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
        await axios.post(`${apiUrl}/auth/login/verify-reset-code`, {
            email: emailForReset.value,
            code: resetCode.value
        });
        isCodeVerified.value = true; // Показываем поле "Новый пароль" и кнопку "Обновить пароль"
    } catch (error) {
        console.error('Error verifying reset code:', error);
        toast.add({ severity: 'info', summary: 'Ой!', detail: 'Неверный код подтверждения. Пожалуйста, попробуйте снова', life: 8000 });
    }
}

function startResendTimer() {
    canResendCode.value = false; // Блокируем кнопку повторной отправки
    resendTimer.value = 60; // Устанавливаем таймер на 60 секунд

    const interval = setInterval(() => {
        resendTimer.value--; // Уменьшаем таймер на 1 секунду
        if (resendTimer.value <= 0) {
            clearInterval(interval); // Останавливаем таймер
            canResendCode.value = true; // Разблокируем кнопку повторной отправки
        }
    }, 1000); // Запускаем таймер каждую секунду
}

// Функция для обновления пароля
async function updatePassword() {
    resetErrors.value.newPassword = '';

    if (!newPassword.value) {
        resetErrors.value.newPassword = 'Пожалуйста, введите новый пароль';
        return;
    }

    try {
        const response = await axios.post(`${apiUrl}/auth/login/reset-password`, {
            email: emailForReset.value,
            code: resetCode.value,
            newPassword: newPassword.value
        });
        
        toast.add({ 
            severity: 'success', 
            summary: 'Успех!', 
            detail: response.data.message || 'Пароль успешно обновлен.', 
            life: 8000 
        });

        // Автоматически нажимаем кнопку "Назад"
        goBack();
    } catch (error) {
        console.error('Error updating password:', error);
        
        let errorMessage = 'Ошибка при попытке изменения пароля.';
        if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast.add({ 
            severity: 'error', 
            summary: 'Ошибка!', 
            detail: errorMessage, 
            life: 8000 
        });
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
                        <Button :to="{ name: 'registration' }" label="Подвтердить почту" class="w-full" severity="secondary" text @click="goToCode" />
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

                        <!-- Кнопка "Запросить код повторно" -->
                        <Button label="Запросить код повторно" class="w-full" @click="requestPasswordReset" severity="info" v-if="isCodeSent && !canResendCode" :disabled="true"> Запросить код повторно ({{ resendTimer }} сек) </Button>
                        <Button label="Запросить код повторно" class="w-full" @click="requestPasswordReset" severity="info" v-if="isCodeSent && canResendCode"></Button>

                        <Button label="Проверить код" class="w-full" @click="verifyResetCode" severity="info" v-if="isCodeSent && !isCodeVerified"></Button>
                        <Button label="Обновить пароль" class="w-full" @click="updatePassword" severity="info" v-if="isCodeVerified"></Button>
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
