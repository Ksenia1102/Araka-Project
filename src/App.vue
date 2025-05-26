<script setup>
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import { provide, ref } from 'vue';

const loadingOverlay = ref();

// Предоставляем методы дочерним компонентам
provide('loading', {
    show: (msg) => loadingOverlay.value?.showLoading(msg),
    hide: () => loadingOverlay.value?.hideLoading()
});
</script>

<template>
    <router-view />
    <Toast /><!-- Контейнер для тостов -->
    <LoadingOverlay ref="loadingOverlay" /><!-- элемент загрузки -->
</template>

<style scoped></style>
