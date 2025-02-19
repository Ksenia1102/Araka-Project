<script setup>
import { useLayout } from '@/layout/composables/layout';
import * as FileSaver from 'file-saver'; // Правильный способ импорта
import { useRouter } from 'vue-router';
import AppConfigurator from './AppConfigurator.vue';
const apiUrl = import.meta.env.VITE_API_URL;
const router = useRouter();
function goToUser() {
    router.push({ name: 'user' });
}

async function downloadFile() {
    try {
        const response = await fetch(`${apiUrl}/cards/download`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при скачивании файла');
        }

        const blob = await response.blob();

        // Используем saveAs через FileSaver
        FileSaver.saveAs(blob, 'Cards.pdf');
    } catch (error) {
        console.error('Ошибка:', error);
    }
}
function logout() {
    // Удаляем токен из localStorage (или sessionStorage)
    localStorage.removeItem('token');
    // Перенаправляем пользователя на главную страницу
    router.push({ name: 'Home' });
}

const { onMenuToggle } = useLayout();
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>

            <router-link to="/" class="layout-topbar-logo">
                <img src="/logo.svg" alt="" />
                <span>EduVision</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <div class="relative">
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button v-tooltip.bottom="'Скачать карточки'" type="button" class="layout-topbar-action" @click="downloadFile">
                        <i class="pi pi-download"></i>
                        <span>download</span>
                    </button>
                    <button v-tooltip.bottom="'Скачать приложение'" type="button" class="layout-topbar-action">
                        <i class="pi pi-android"></i>
                        <span>question</span>
                    </button>
                    <button v-tooltip.bottom="'Профиль'" type="button" class="layout-topbar-action" :to="{ name: 'user' }" as="router-link" @click="goToUser">
                        <i class="pi pi-user"></i>
                        <span>user</span>
                    </button>
                    <button v-tooltip.bottom="'Выйти'" type="button" class="layout-topbar-action" @click="logout">
                        <i class="pi pi-sign-out"></i>
                        <span>exit</span>
                    </button>
                    <!-- <IconField iconPosition="left">
                        <InputText type="text" placeholder="Поиск" />
                        <InputIcon class="pi pi-search" />
                    </IconField> -->
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.toggle-switch-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

h2 {
    font-size: 1.2em;
    color: #333;
}
</style>
