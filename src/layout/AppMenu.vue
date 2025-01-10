<!-- меню!!! -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import AppMenuItem from './AppMenuItem.vue';

const router = useRouter();
const display = ref(false);

function open() {
    display.value = true;
}
// function close() {
//     display.value = false;
// }

const model = ref([
    {
        items: [
            { label: 'Библиотека', icon: 'pi pi-fw pi-home', to: '/pages/dashboard' },
            { label: 'Отчеты', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/working' }
            // { label: 'Тестовая страница', icon: 'pi pi-fw pi-home', to: '/pages/test' }
        ]
    }
]);

// Классы
// Модель меню с "Классами" как корневым элементом
const model1 = ref([
    {
        items: [
            {
                label: 'Классы',
                icon: 'pi pi-fw pi-bookmark',
                items: [] // Сюда будут добавляться новые классы
            }
        ]
    }
]);

//const classes = ref([]);

// Поля для ввода названий новых классов
const newClassInputs = ref(Array(8).fill('')); // Поля для ввода новых классов

function createClasses() {
    const newClasses = newClassInputs.value.filter((name) => name.trim() !== ''); // Удаляем пустые строки
    if (newClasses.length > 0) {
        const classMenu = model1.value[0].items.find((item) => item.label === 'Классы');
        newClasses.forEach((name) => {
            classMenu.items.push({
                label: name,
                icon: 'pi pi-fw pi-bookmark',
                to: `/uikit/class/${name.replace(/\s+/g, ' ').toLowerCase()}` // Генерация пути
            });
        });

        // Сброс полей ввода и закрытие модального окна
        newClassInputs.value = Array(8).fill('');
        display.value = false;

        // Переход на первый созданный класс
        router.push(classMenu.items[classMenu.items.length - newClasses.length].to);
    }
}

// const model1 = ref([
//     {
//         items: [
//             {
//                 label: 'Классы',
//                 icon: 'pi pi-fw pi-bookmark',
//                 showButton: true,
//                 items: [
//                     {
//                         label: 'Класс А',
//                         icon: 'pi pi-fw pi-bookmark'
//                     },
//                     {
//                         label: 'Класс В',
//                         icon: 'pi pi-fw pi-bookmark',
//                         showButton: true
//                     }
//                 ]
//             }
//         ]
//     }
// ]);

// const model2 = ref([
//     {
//         items: [
//             {
//                 label: 'Разделы',
//                 icon: 'pi pi-fw pi-bookmark',
//                 items: [
//                     {
//                         label: 'Раздел 1',
//                         icon: 'pi pi-fw pi-bookmark'
//                     },
//                     {
//                         label: 'Раздел 2',
//                         icon: 'pi pi-fw pi-bookmark',
//                         showButton: true
//                     }
//                 ]
//             }
//         ]
//     }
// ]);
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
        <!-- <Dialog header="Новые классы" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '40vw' }" :modal="true">
            <p class="leading-normal m-0 mb-4">Мы рекомендуем выбирать короткие и понятные названия, например, "Химия 9Б" или "Математика 10А".</p>
            <div class="form-container">

                <div class="form-column">
                    <InputText placeholder="Введите название класса"></InputText>
                    <InputText placeholder="Введите название класса"></InputText>
                    <InputText placeholder="Введите название класса"></InputText>
                    <InputText placeholder="Введите название класса"></InputText>
                </div>


                <div class="form-column">
                    <InputText placeholder="Введите название класса"></InputText>
                    <InputText placeholder="Введите название класса"></InputText>
                    <InputText placeholder="Введите название класса"></InputText>
                    <InputText placeholder="Введите название класса"></InputText>
                </div>
            </div>
            <Button label="Создать классы" @click="close" class="import-btn" severity="info" icon="pi pi-plus-circle" style="width: -webkit-fill-available" />
        </Dialog> -->

        <!-- Модальное окно для добавления классов -->
        <!-- Модальное окно для добавления классов -->
        <Dialog header="Новые классы" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '40vw' }" :modal="true">
            <p class="leading-normal m-0 mb-4">Мы рекомендуем выбирать короткие и понятные названия, например, "Химия 9Б" или "Математика 10А".</p>
            <div class="form-container">
                <div class="form-column">
                    <!-- Поля для ввода -->
                    <InputText v-for="(input, index) in newClassInputs.slice(0, 4)" :key="`column1-${index}`" v-model="newClassInputs[index]" placeholder="Введите название класса" />
                </div>
                <div class="form-column">
                    <InputText v-for="(input, index) in newClassInputs.slice(4, 8)" :key="`column2-${index}`" v-model="newClassInputs[index + 4]" placeholder="Введите название класса" />
                </div>
            </div>
            <Button label="Создать классы" @click="createClasses" class="import-btn" severity="info" icon="pi pi-plus-circle" style="width: 100%" />
        </Dialog>

        <Button @click="open" icon="pi pi-plus" class="mr-2" severity="secondary" text />
        <!-- Меню с классами -->
        <template v-for="(item, i) in model1" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
        <!-- <template v-for="(item, i) in model1" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template> -->
    </ul>
    <!-- <ul
        class="layout-menu"
        style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0; display: flex; align-items: flex-start; flex-direction: row-reverse; justify-content: space-between"
    >
        <Button icon="pi pi-plus" class="mr-2" severity="secondary" text />
        <template v-for="(item, i) in model2" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul> -->
</template>

<style lang="scss" scoped>
/* Контейнер для двух колонок */
.form-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

/* Отдельная колонка */
.form-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
}
</style>
