<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import DeleteClassDialog from './DeleteClassDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import { checkClassExistence } from '@/utils/classChecker.js';

const deleteClassDialog = ref(null);
const toast = useToast();
const apiUrl = import.meta.env.VITE_API_URL;
const display = ref(false);
const route = useRoute();
const router = useRouter();

const editDialogVisible = ref(false);
const classesList = ref([]); // Классы для редактирования

const confirmClassDeletion = (classId, className) => {
    deleteClassDialog.value.open(classId, className);
};

const truncatedTitle = (title) => {
    return title.length > 55 ? title.substring(0, 55) + '...' : title;
};

// Function to open the edit dialog
const openEditDialog = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/classes/user/my`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        classesList.value = response.data;
        editDialogVisible.value = true;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить классы для редактирования',
            life: 3000
        });
    }
};

function open() {
    display.value = true;
}

const model = ref([
    {
        items: [
            { label: 'Библиотека', icon: 'pi pi-fw pi-home', to: '/pages/dashboard' },
            { label: 'Отчеты', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' }
        ]
    }
]);

// Classes
// Menu model with "Classes" as the root element
const model1 = ref([
    {
        items: [] // Classes will be added directly here
    }
]);

// Fields for new class names
const newClassInputs = ref(Array(8).fill('')); // Fields for new classes

async function saveClass(classTitle) {
    // Input validation
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
                }
            }
        );
        // Return normalized data
        return {
            classId: response.data.classId,
            title: response.data.title
        };
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Не удалось создать класс. Проверьте данные и попробуйте снова.';
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: errorMessage,
            life: 3000
        });
        return null;
    }
}

async function createClasses() {
    const newClassesTitles = newClassInputs.value.filter((name) => name.trim() !== '');

    if (newClassesTitles.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Введите хотя бы одно название класса.',
            life: 3000
        });
        return;
    }

    const createdClassItems = []; // Create a temporary array to track created classes
    for (const name of newClassesTitles) {
        try {
            const result = await saveClass(name);
            if (result && result.classId) {
                createdClassItems.push({
                    label: result.title,
                    to: `/uikit/class/${result.classId.id}/${result.title}`,
                    state: {
                        classTitle: result.title
                    },
                    badge: null
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

    await fetchClasses(); // Refresh class list after creation

    // Reset input fields and close modal
    newClassInputs.value = Array(8).fill('');
    display.value = false;

    // Navigate to the first created class (if any)
    if (createdClassItems.length > 0) {
        router.push(createdClassItems[0].to);
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

        // Add classes directly to items
        model1.value[0].items = response.data.map((classItem) => ({
            label: classItem.title,
            to: `/uikit/class/${classItem.id}/${classItem.title}`,
            state: {
                classTitle: classItem.title
            },
            badge: classItem.studentsCount > 0 ? classItem.studentsCount.toString() : null
        }));
        // Also update the classesList for the edit dialog
        classesList.value = response.data;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить классы. Попробуйте снова.',
            life: 3000
        });
    }
}

// New function to handle class deletion event
const handleClassDeleted = async (deletedClassId) => {
    await fetchClasses(); // Refresh both menu and edit dialog lists

    // Check if the user was on the deleted class's page
    if (route.params.classId === deletedClassId) {
        router.push('/pages/dashboard'); // Redirect to dashboard
    }
};

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
    <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0rem; margin: 1rem 0;">
        <Dialog header="Новые классы" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '40vw' }" :modal="true">
            <p class="leading-normal m-0 mb-4">Мы рекомендуем выбирать короткие и понятные названия, например, "Химия 9Б" или "Математика 10А".</p>
            <div class="form-column">
                <InputText v-maxlength="40" v-for="(_, index) in newClassInputs.slice(0, 4)" :key="`column1-${index}`" v-model="newClassInputs[index]" placeholder="Введите название класса" />
            </div>
            <div class="form-column">
                <InputText v-maxlength="40" v-for="(_, index) in newClassInputs.slice(4, 8)" :key="`column2-${index}`" v-model="newClassInputs[index + 4]" placeholder="Введите название класса" />
            </div>
            <Button label="Создать классы" @click="createClasses" class="import-btn" icon="pi pi-plus-circle" style="width: 100%" />
        </Dialog>

        <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="pi pi-fw pi-users"></i>
                    <span class="font-medium">Классы</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <Button v-tooltip.bottom="'Редактировать классы'" @click="openEditDialog" icon="pi pi-pencil" severity="secondary" text />
                    <Button v-tooltip.bottom="'Создать класс'" @click="open" icon="pi pi-plus" severity="secondary" text/>
                </div>
            </div>
            <template v-for="(item, i) in model1" :key="item">
                <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
                <li v-if="item.separator" class="menu-separator"></li>
            </template>
        </ul>

        <DeleteClassDialog ref="deleteClassDialog" :api-url="apiUrl" @deleted="handleClassDeleted"/>
    </ul>
    <Dialog v-model:visible="editDialogVisible" header="Управление классами" :style="{ width: '50vw', maxWidth: '600px' }" :modal="true" @hide="checkClassExistence(route.params.classId, router, toast, apiUrl, loading)">
        <div class="classes-edit-container">
            <div v-if="classesList.length === 0" class="empty-message">
                <span>Нет доступных классов</span>
            </div>

            <div v-else class="classes-list">
                <div v-for="(classItem, index) in classesList" :key="classItem.id" class="class-item">
                    <div class="class-row">
                        <div class="class-info">
                            <span class="class-title">{{ truncatedTitle(classItem.title) }}</span>
                            <span v-if="classItem.studentsCount" class="student-count">({{ classItem.studentsCount }})</span>
                        </div>

                        <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmClassDeletion(classItem.id, classItem.title)" v-tooltip="'Удалить класс'" class="delete-btn"/>
                    </div>

                    <Divider v-if="index < classesList.length - 1" />
                </div>
            </div>
        </div>
    </Dialog>
</template>

<style scoped>
.classes-edit-container {
    padding: 0.5rem;
}

.empty-message {
    display: flex;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-secondary);
}

.classes-list {
    display: flex;
    flex-direction: column;
    gap: 0rem;
}

.class-item {
    padding: 0rem 0;
}

.class-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0rem;
}

.class-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.class-title {
    font-weight: 500;
}

.student-count {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
}

.delete-btn {
    color: var(--red-500);
    margin-left: 1rem;
}

.delete-btn:hover {
    background: rgba(239, 68, 68, 0.1) !important;
}
</style>
