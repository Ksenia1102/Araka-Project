<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref } from 'vue';
import AppConfigurator from './AppConfigurator.vue';

// import ToggleSwitchButton from 'toggle-switch-button-vue';

// Создаем переменную для состояния переключателя
const isActive = ref(true);

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
                <img src="/logoB.svg" alt="" />

                <span>EduVision</span>
            </router-link>
            <!-- переключатель -->
            <!-- <ToggleSwitch v-model="switchValue" /> -->

            <!-- <div class="dashboard">
                <div class="toggle-switch-section">
                    <ToggleSwitch v-model="isActive" label="ON|OFF" />
                </div>
            </div> -->
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
                    <IconField iconPosition="left">
                        <InputText type="text" placeholder="Search" />
                        <InputIcon class="pi pi-search" />
                    </IconField>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-download"></i>
                        <span>download</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-android"></i>
                        <span>question</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>user</span>
                    </button>
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
