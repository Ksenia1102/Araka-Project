<script setup>
import AppMenu from './AppMenu.vue';
</script>

<script>
// import { useRouter } from 'vue-router';
// const router = useRouter();
export default {
    methods: {
        openNewTab() {
            this.$router.push({ name: 'survey' });
        }
    }
};
</script>

<template>
    <div class="layout-sidebar">
        <Button label="Создать опрос" :to="{ name: 'survey' }" @click="openNewTab" icon="pi pi-plus" severity="info" class="mr-2 mb-2" style="width: 100%"></Button>
        <app-menu></app-menu>
    </div>
</template>

<style lang="scss" scoped></style>
