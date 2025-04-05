<!-- меню!!! -->
<script setup>
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppMenuItem from './AppMenuItem.vue';
const apiUrl = import.meta.env.VITE_API_URL;
const router = useRouter();
const display = ref(false);

function getUserIdFromToken() {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Токен не найден');
        return null;
    }

    try {
        // Декодируем токен
        const decoded = jwtDecode(token);

        // Проверка на наличие id в декодированном токене
        if (decoded && decoded.id) {
            return decoded.id;
        } else {
            console.error('Токен не содержит поля id');
            return null;
        }
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return null;
    }
}
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

async function saveClass(userId, classTitle) {
    // Валидация входных данных
    if (!userId || !classTitle?.trim()) {
        alert('Пожалуйста, укажите корректные данные класса');
        return null;
    }
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${apiUrl}/api/classes`,
            {
                user_id: userId,
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
            id: response.data.id, // Используем стандартное поле id
            classId: response.data.id, // Для обратной совместимости
            title: response.data.title,
            createdAt: response.data.createdAt // Если сервер возвращает
        };
    } catch (error) {
        console.error('Ошибка создания класса:', error);

        // Детализированная обработка ошибок
        const errorMessage = error.response?.data?.error || 'Не удалось создать класс. Проверьте данные и попробуйте снова.';

        alert(errorMessage);

        // // Автоматический logout при 401
        // if (error.response?.status === 401) {
        //     router.push('/login');
        // }

        return null;
    }
}
async function createClasses() {
    const userId = getUserIdFromToken(); // Пример ID пользователя (замените на динамическое значение, если доступно)
    // Получить список новых классов из введенных данных
    const newClasses = newClassInputs.value.filter((name) => name.trim() !== ''); // Удаляем пустые строки
    if (newClasses.length > 0) {
        const classMenu = model1.value[0].items.find((item) => item.label === 'Классы');
        for (const name of newClasses) {
            try {
                // Сохраняем класс на сервере и получаем его ID
                const { classId, title } = await saveClass(userId, name);
                if (classId) {
                    // Добавляем класс в меню с использованием classId
                    classMenu.items.push({
                        label: title,
                        icon: 'pi pi-fw pi-bookmark',
                        to: `/uikit/class/${classId}/${title}` // Путь с динамическим ID
                    });
                }
            } catch (error) {
                console.error(`Ошибка при сохранении класса "${name}":`, error);
            }
        }

        // Сброс полей ввода и закрытие модального окна
        newClassInputs.value = Array(8).fill('');
        display.value = false;

        // Переход на первый созданный класс
        const firstCreatedClass = classMenu.items[classMenu.items.length - newClasses.length];
        router.push(firstCreatedClass.to);
    } else {
        alert('Введите хотя бы одно название класса.');
    }
}

function getUserID() {
    const token = localStorage.getItem('authToken'); // Извлекаем токен из localStorage
    if (!token) {
        console.error('Пользователь не авторизован');
        this.$router.push({ name: 'login' }); // Перенаправление на страницу входа
        return;
    }

    try {
        // Используем jwt-decode для извлечения данных из токена
        const decoded = jwtDecode(token);
        if (decoded && decoded.id) {
            return decoded.id; // Устанавливаем userId из токена
        } else {
            throw new Error('ID пользователя отсутствует в токене');
        }
    } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        this.$router.push({ name: 'login' }); // Перенаправление на страницу входа
    }

    if (this.questions.length === 0) {
        this.addQuestion();
    }
}

async function fetchClasses() {
    try {
        const token = localStorage.getItem('authToken');
        const userId = getUserID();
        const response = await axios.get(`${apiUrl}/api/classes/user/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
                // 'Accept': 'application/json'
            }
        });

        // const classes = response.data;
        const classMenu = model1.value[0].items.find((item) => item.label === 'Классы');
        classMenu.items = response.data.map((classItem) => ({
            label: classItem.title,
            icon: 'pi pi-fw pi-bookmark',
            to: `/uikit/class/${classItem.id}/${classItem.title}`,
            state: {
                classTitle: classItem.title // Дополнительные данные в маршруте
            },
            badge: classItem.studentsCount > 0 ? classItem.studentsCount.toString() : null
        }));
    } catch (error) {
        console.error('Ошибка при загрузке классов:', error);
        alert('Не удалось загрузить классы. Попробуйте снова.');
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
