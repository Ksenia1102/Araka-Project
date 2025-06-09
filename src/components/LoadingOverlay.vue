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

<style scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    pointer-events: auto; /* Блокирует клики */
}

.loading-message {
    color: white;
    margin-top: 1rem;
    font-size: 1.2rem;
}
</style>
