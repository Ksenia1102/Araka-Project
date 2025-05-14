<!-- меню!!! -->
<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppMenuItem from './AppMenuItem.vue';
const toast = useToast();
const apiUrl = import.meta.env.VITE_API_URL;
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
            { label: 'Отчеты', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' }
            //{ label: 'Тестовая страница', icon: 'pi pi-fw pi-home', to: '/pages/test' }
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

async function saveClass(classTitle) {
    // Валидация входных данных
    if (!classTitle?.trim()) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Пожалуйста, укажите корректные данные класса',
            life: 3000
        });
        return null;
    }
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${apiUrl}/api/classes`,
            {
                title: classTitle.trim()
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                    // 'Content-Type': 'application/json'
                }
            }
        );
        // Возвращаем нормализованные данные
        return {
            classId: response.data.classId, // Для обратной совместимости
            title: response.data.title
        };
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Ошибка создания класса',
            life: 3000
        });

        // Детализированная обработка ошибок
        const errorMessage = error.response?.data?.error || 'Не удалось создать класс. Проверьте данные и попробуйте снова.';

       toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: errorMessage,
            life: 3000
        });

        // // Автоматический logout при 401
        // if (error.response?.status === 401) {
        //     router.push('/login');
        // }

        return null;
    }
}
async function createClasses() {
    // const userId = getUserIdFromToken(); // Пример ID пользователя (замените на динамическое значение, если доступно)
    // Получить список новых классов из введенных данных
    const newClasses = newClassInputs.value.filter((name) => name.trim() !== ''); // Удаляем пустые строки
    if (newClasses.length > 0) {
        const classMenu = model1.value[0].items.find((item) => item.label === 'Классы');
        for (const name of newClasses) {
            try {
                // Сохраняем класс на сервере и получаем его ID
                const { classId, title } = await saveClass(name);
                console.log(classId);
                if (classId) {
                    // Добавляем класс в меню с использованием classId
                    classMenu.items.push({
                        label: title,
                        icon: 'pi pi-fw pi-bookmark',
                        to: `/uikit/class/${classId.id}/${title}` // Путь с динамическим ID
                    });
                }
            } catch (error) {
                toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: `Ошибка при сохранении класса "${name}":`,
                life: 3000
            });
            }
        }

        // Сброс полей ввода и закрытие модального окна
        newClassInputs.value = Array(8).fill('');
        display.value = false;

        // Переход на первый созданный класс
        const firstCreatedClass = classMenu.items[classMenu.items.length - newClasses.length];
        router.push(firstCreatedClass.to);
    } else {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Введите хотя бы одно название класса.',
            life: 3000
        });
    }
}

async function fetchClasses() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/classes/user/my`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const classMenu = model1.value[0].items.find((item) => item.label === 'Классы');

        classMenu.items = response.data.map((classItem) => ({
            label: classItem.title,
            icon: 'pi pi-fw pi-bookmark',
            to: `/uikit/class/${classItem.id}/${classItem.title}`,
            state: {
                classTitle: classItem.title
            },
            badge: classItem.studentsCount > 0 ? classItem.studentsCount.toString() : null
        }));
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить классы. Попробуйте снова.',
            life: 3000
        });
    }
}

onMounted(() => {
    fetchClasses();
});
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
        <!-- Модальное окно для добавления классов -->
        <Dialog header="Новые классы" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '40vw' }" :modal="true">
            <p class="leading-normal m-0 mb-4">Мы рекомендуем выбирать короткие и понятные названия, например, "Химия 9Б" или "Математика 10А".</p>
            <div class="form-container">
                <div class="form-column">
                    <!-- Поля для ввода -->
                    <InputText v-maxlength="40" v-for="(input, index) in newClassInputs.slice(0, 4)" :key="`column1-${index}`" v-model="newClassInputs[index]" placeholder="Введите название класса" />
                </div>
                <div class="form-column">
                    <InputText v-maxlength="40" v-for="(input, index) in newClassInputs.slice(4, 8)" :key="`column2-${index}`" v-model="newClassInputs[index + 4]" placeholder="Введите название класса" />
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
