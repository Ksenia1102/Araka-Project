<script setup>
import ProgressSpinner from 'primevue/progressspinner';
import { ref } from 'vue';

const isLoading = ref(false);
const message = ref('Загрузка...');

// Функции для управления извне
const showLoading = (msg = 'Загрузка...') => {
    message.value = msg;
    isLoading.value = true;
};

const hideLoading = () => {
    isLoading.value = false;
};

// Экспортируем функции для использования в других компонентах
defineExpose({ showLoading, hideLoading });
</script>

<template>
    <div v-if="isLoading" class="loading-overlay" @click.stop>
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" animationDuration=".5s" aria-label="Loading" />
        <p class="loading-message">{{ message }}</p>
    </div>
</template>

<style scoped></style>
