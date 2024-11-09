<script setup>
import AppMenu from './AppMenu.vue';
</script>

<script>
export default {
    methods: {
        openNewTab() {
            window.open('/pages/survey', '_blank');
        }
    }
};
</script>

<template>
    <div class="layout-sidebar">
        <Button label="Создать опрос" :to="{ name: 'survey' }" @click="openNewTab" icon="pi pi-plus" class="mr-2 mb-2" style="width: 100%"></Button>
        <app-menu></app-menu>
    </div>
</template>

<style lang="scss" scoped></style>
