<script setup>
//import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { ref } from 'vue';
// import { useRouter } from 'vue-router';

// const router = useRouter();

// function goToDashboard() {
//     router.push({ name: 'dashboard' });
// }
const email = ref('');
const password = ref('');
const checked = ref(false);
</script>

<template>
    <!-- <FloatingConfigurator /> -->
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="flex items-center justify-center">
                            <img src="/logo.svg" style="margin-bottom: 1rem; width: 30px" alt="New Image" />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">EduVision</div>
                        </div>
                        <span class="text-muted-color font-medium">Авторизация</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Почта</label>
                        <InputText id="email1" type="text" placeholder="Введите почту" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Пароль</label>
                        <Password id="password1" v-model="password" placeholder="Введите пароль" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Запомнить меня</label>
                            </div>
                            <!-- <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span> -->
                        </div>
                        <Button :to="{ name: 'dashboard' }" severity="info" label="Войти" class="w-full" as="router-link"></Button>
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
