<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const toast = useToast();
const router = useRouter();
const apiUrl = import.meta.env.VITE_API_URL;

function goToLogin() {
    router.push({ name: 'login' });
}

const email = ref('');
const verificationCode = ref('');
const errors = ref({ 
    email: '', 
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

async function sendCode() {
    // Сброс ошибок
    errors.value = { 
        email: '', 
        verificationCode: '' 
    };

    // Проверка на пустые поля
    if (!email.value) {
        errors.value.email = 'Пожалуйста, заполните почту';
    } else if (!validateEmail(email.value)) {
        errors.value.email = 'Пожалуйста, введите корректный адрес почты';
    }

    // Если есть ошибки, прекратить выполнение
    if (errors.value.email) {
        return;
    }

    isLoading.value = true;
    try {
        const response = await axios.post(`${apiUrl}/auth/code/send`, {
            email: email.value
        });
        console.log('Code sent:', response.data);
        isCodeSent.value = true;
        startResendTimer();
        toast.add({ severity: 'success', summary: 'Отлично!', detail: 'Код подтверждения отправлен на вашу почту. Без подтверждения аккаунта вход будет невозоможен.', life: 8000 });
    } catch (error) {
        console.error('Error sending code:', error);
        if (error.response && error.response.status === 400) {
            if (error.response.data === 'Почта уже занята') {
                errors.value.email = 'Почта уже занята';
            }
        } else {
            toast.add({ severity: 'error', summary: 'Ошибка!', detail: 'Ошибка при отправке кода.', life: 8000 });
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
        const response = await axios.post(`${apiUrl}/auth/code/verify`, {
            email: email.value,
            code: verificationCode.value
        });
        console.log('Email verified:', response.data);
        router.push({ name: 'login' });
    } catch (error) {
        console.error('Error verifying code:', error);
        toast.add({ severity: 'info', summary: 'Ой!', detail: 'Неверный код подтверждения. Пожалуйста, попробуйте снова', life: 8000 });
    }
}

async function resendVerificationCode() {
    errors.value.email = '';

    if (!email.value) {
        errors.value.email = 'Пожалуйста, заполните почту';
        return;
    }

    try {
        const response = await axios.post(`${apiUrl}/code/resend`, {
            email: email.value
        });
        console.log('Код отправлен:', response.data);
        startResendTimer();
        toast.add({ severity: 'success', summary: 'Отлично!', detail: 'Код подтверждения отправлен на вашу почту. Без подтверждения аккаунта вход будет невозоможен.', life: 8000 });
    } catch (error) {
        console.error('Ошибка при отправке кода:', error);
        toast.add({ severity: 'error', summary: 'Ошибка!', detail: 'Ошибка при отправке кода.', life: 8000 });
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
                        <span class="text-muted-color font-medium">Подтверждение почты</span>
                    </div>
                    <div>
                        <!-- Поле для почты -->
                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">
                            Почта
                            <span class="text-red-500">*</span>
                        </label>
                        <p v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</p>
                        <InputText id="email" type="email" placeholder="Почта" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <!-- Поле для кода подтверждения (появляется после отправки кода) -->
                        <div v-if="isCodeSent">
                            <label for="verificationCode" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">
                                Код подтверждения
                                <span class="text-red-500">*</span>
                            </label>
                            <p v-if="errors.verificationCode" class="text-red-500 text-sm">{{ errors.verificationCode }}</p>
                            <InputText id="verificationCode" type="text" placeholder="Код подтверждения" class="w-full md:w-[30rem] mb-8" v-model="verificationCode" />
                        </div>
                        <div>
                            <Button :to="{ name: 'login' }" label="Уже есть аккаунт" class="w-full" severity="secondary" text @click="goToLogin"></Button>

                            <!-- Кнопка "Отправить код" -->
                            <Button 
                                v-if="!isCodeSent" 
                                label="Отправить код" 
                                class="w-full" 
                                @click="sendCode" 
                                severity="info" 
                                :disabled="isLoading"
                            >
                                <span v-if="isLoading">Отправляем код на почту...</span>
                                <span v-else>Отправить код</span>
                            </Button>

                            <!-- Кнопка подтверждения кода -->
                            <Button v-if="isCodeSent" label="Подтвердить код" class="w-full" @click="verifyCode" severity="info"></Button>

                            <!-- Кнопка "Запросить код повторно" -->
                            <Button v-if="isCodeSent" label="Запросить код повторно" class="w-full mt-4" @click="resendVerificationCode" severity="secondary" :disabled="isResendDisabled">
                                <span v-if="isResendDisabled">Запросить код повторно ({{ countdown }} сек)</span>
                                <span v-else>Запросить код повторно</span>
                            </Button>
                        </div>
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