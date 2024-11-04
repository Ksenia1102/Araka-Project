<!-- меню!!! -->
<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        items: [
            { label: 'Библиотека', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Отчеты', icon: 'pi pi-fw pi-home', to: '/pages/auth/login' },
            { label: 'Ученики', icon: 'pi pi-fw pi-home', to: '/uikit/filedoc' }
        ]
    }
]);

const model1 = ref([
    {
        items: [
            {
                label: 'Классы',
                icon: 'pi pi-fw pi-bookmark',
                showButton: true,
                items: [
                    {
                        label: 'Класс А',
                        icon: 'pi pi-fw pi-bookmark'
                    },
                    {
                        label: 'Класс В',
                        icon: 'pi pi-fw pi-bookmark',
                        showButton: true
                    }
                ]
            }
        ]
    }
]);

const model2 = ref([
    {
        items: [
            {
                label: 'Разделы',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                    {
                        label: 'Раздел 1',
                        icon: 'pi pi-fw pi-bookmark'
                    },
                    {
                        label: 'Раздел 2',
                        icon: 'pi pi-fw pi-bookmark',
                        showButton: true
                    }
                ]
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
    <ul
        class="layout-menu"
        style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0; display: flex; align-items: flex-start; flex-direction: row-reverse; justify-content: space-between"
    >
        <Button icon="pi pi-plus" class="mr-2" severity="secondary" text />
        <template v-for="(item, i) in model1" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
    <ul
        class="layout-menu"
        style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0; display: flex; align-items: flex-start; flex-direction: row-reverse; justify-content: space-between"
    >
        <Button icon="pi pi-plus" class="mr-2" severity="secondary" text />
        <template v-for="(item, i) in model2" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
