<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import AppConfigurator from './AppConfigurator.vue';

const router = useRouter();

function goToUser() {
    router.push({ name: 'user' });
}
const { onMenuToggle } = useLayout();
// const switchValue = ref(false);
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>

            <!-- лого -->
            <router-link to="/" class="layout-topbar-logo">
                <img src="/logo.svg" alt="" />

                <span>EduVision</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <!-- <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button> -->
                <div class="relative">
                    <!-- <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button> -->
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
                    <!-- <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button> -->
                    <!-- поиск, см в инпут док -->
                    <button v-tooltip.bottom="'Скачать карточки'" type="button" class="layout-topbar-action">
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
                    <button v-tooltip.bottom="'Выйти'" type="button" class="layout-topbar-action">
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
