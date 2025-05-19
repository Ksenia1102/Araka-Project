<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const apiUrl = import.meta.env.VITE_API_URL;
const toast = useToast();
const router = useRouter();

// const surveyTree = ref([
//     {
//         key: '0',
//         data: { name: 'Рабочие опросы', type: 'folder', modified: null },
//         children: [
//             {
//                 key: '0-0',
//                 data: { name: 'Опрос HR', type: 'survey', modified: '2024-04-24' }
//             },
//             {
//                 key: '0-1',
//                 data: { name: 'Опрос tt', type: 'survey', modified: '2024-04-24' }
//             }
//         ]
//     },
//     {
//         key: '1',
//         data: { name: 'Опрос вне папки', type: 'survey', modified: '2024-04-20' }
//     },
//     {
//         key: '2',
//         data: { name: 'Опрос вне папки', type: 'survey', modified: '2024-04-20' }
//     },
//     {
//         key: '3',
//         data: { name: 'Рабочее', type: 'folder', modified: null }
//     }
// ]);
const surveyTree = ref([]); // Теперь это будет заполняться из API

// Загрузка опросов без папок
async function loadUnfolderedSurveys() {
    try {
        const token = localStorage.getItem('authToken');
        console.log(token);
        const response = await axios.get(`${apiUrl}/api/folders/unfoldered/surveys`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            validateStatus: function (status) {
                // Считаем 404 (Not Found) валидным статусом
                return (status >= 200 && status < 300) || status === 404;
            }
        });
        // Если 404 - возвращаем пустой массив
        if (response.status === 404) {
            return [];
        }
        // Преобразуем в формат TreeTable
        return response.data.map((survey) => ({
            key: `survey-${survey.id}`,
            data: {
                name: survey.title,
                type: 'survey',
                modified: survey.updated_at || survey.created_at,
                id: survey.id
            }
        }));
    } catch (error) {
        console.error('Ошибка загрузки опросов без папок:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить опросы без папок',
            life: 3000
        });
        return [];
    }
}

// Загрузка данных с сервера
async function loadSurveyTree() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('TOKEEN', token);

        // Загружаем параллельно папки и опросы без папок
        const [foldersRes, unfolderedSurveys] = await Promise.all([
            axios.get(`${apiUrl}/api/folders`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            loadUnfolderedSurveys()
        ]);

        // Преобразуем папки
        const folders = transformApiData(foldersRes.data);

        // Объединяем: папки + опросы без папок (после папок)
        surveyTree.value = [...folders, ...unfolderedSurveys];

        // Сортировка: папки сверху, опросы снизу (на всякий случай)
        sortSurveyTree(surveyTree.value);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить данные',
            life: 3000
        });
    }
}

// Преобразование данных API в структуру для TreeTable
function transformApiData(apiData) {
    return apiData.map((folder) => ({
        key: `folder-${folder.id}`,
        data: {
            name: folder.name,
            type: 'folder',
            modified: folder.updated_at,
            id: folder.id // Сохраняем реальный ID из БД
        },
        children: folder.surveys.map((survey) => ({
            key: `survey-${survey.id}`,
            data: {
                name: survey.title,
                type: 'survey',
                modified: survey.updated_at || survey.created_at,
                id: survey.id // Сохраняем реальный ID из БД
            }
        }))
    }));
}

// Вызываем загрузку данных при монтировании компонента
onMounted(() => {
    loadSurveyTree();
});

const selectedNode = ref(null);
const draggedNode = ref(null); // сюда кладем весь узел
const contextMenu = ref();
const contextMenuFolder = ref(null);
const display = ref(false); // видимость модалки
const newFolderName = ref('');
const freeSurveys = ref([]); // опросы без папок
const selectedSurveys = ref([]); // выбранные опросы в модалке
// const router = useRouter();

// открытие модалки
function openCreateFolderDialog() {
    updateFreeSurveys(); // при открытии обновим список свободных опросов
    display.value = true;
}
// закрытие модалки
function closeCreateFolderDialog() {
    display.value = false;
    newFolderName.value = '';
    selectedSurveys.value = [];
}
// Функция обновления списка свободных опросов
// (берем только те опросы, что лежат в корне, без папок)
function updateFreeSurveys() {
    freeSurveys.value = surveyTree.value.filter((node) => node.data.type === 'survey');
}
// сохранение новой папки
async function saveNewFolder() {
    if (!newFolderName.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Введите имя папки',
            life: 3000
        });
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${apiUrl}/api/folders`,
            {
                name: newFolderName.value,
                survey_ids: selectedSurveys.value.map((id) => id.replace('survey-', ''))
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // Обновляем дерево после успешного создания
        await loadSurveyTree();
        closeCreateFolderDialog();

        toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Папка успешно создана',
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка создания папки:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось создать папку',
            life: 3000
        });
    }
}
// сортировка папок перед опросами
function sortSurveyTree(nodes) {
    nodes.sort((a, b) => {
        if (a.data.type === b.data.type) return 0;
        return a.data.type === 'folder' ? -1 : 1;
    });

    nodes.forEach((node) => {
        if (node.children) {
            sortSurveyTree(node.children); // рекурсивно сортируем внутри папок
        }
    });
}

// Когда начали перетаскивать опрос или папку
// function onDragStart(node) {
//     draggedNode.value = node;
// }

// Когда бросили на папку
function onDropOnFolder(targetFolderNode) {
    console.log('Когда бросили на папку');
    if (draggedNode.value && targetFolderNode.data.type === 'folder') {
        moveNodeIntoFolder(draggedNode.value, targetFolderNode);
        draggedNode.value = null;
    }
}

// Когда бросили в пустое пространство ("корень")
// function onDropOnRoot() {
//     console.log('Когда бросили в пустое пространство');
//     if (draggedNode.value) {
//         moveNodeToRoot(draggedNode.value);
//         draggedNode.value = null;
//     }
// }

// function onDropOnRoot(event) {
//     event.preventDefault();
//     if (draggedNode.value && draggedNode.value.data.type === 'survey') {
//         moveNodeToRoot(draggedNode.value);
//     }
//     draggedNode.value = null;
// }

// Переместить узел в папку
// Перемещение опроса в папку
async function moveNodeIntoFolder(dragged, targetFolder) {
    try {
        const token = localStorage.getItem('authToken');
        await axios.put(
            `${apiUrl}/api/folders/${targetFolder.data.id}/surveys`,
            { survey_id: dragged.data.id },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        await loadSurveyTree();
    } catch (error) {
        console.error('Ошибка перемещения опроса:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось переместить опрос',
            life: 3000
        });
    }
}

const isDragOverRoot = ref(false);

// Обработчик перетаскивания в корень
async function handleRootDrop(event) {
    event.preventDefault();
    isDragOverRoot.value = false;

    if (draggedNode.value?.data?.type === 'survey') {
        await moveNodeToRoot(draggedNode.value);
    }
}

// Обработчик начала перетаскивания
function onDragStart(node, event) {
    event.dataTransfer.setData('text/plain', node.key);
    draggedNode.value = node;
}

// Обработчик входа в зону корня
function handleDragEnter(event) {
    event.preventDefault();
    isDragOverRoot.value = true;
}

// Обработчик выхода из зоны корня
function handleDragLeave(event) {
    event.preventDefault();
    isDragOverRoot.value = false;
}

// Перемещение опроса в корень
async function moveNodeToRoot(node) {
    try {
        const token = localStorage.getItem('authToken');
        await axios.delete(`${apiUrl}/api/folders/surveys/${node.data.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        await loadSurveyTree();
        toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Опрос перемещён в корень',
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка перемещения:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось переместить опрос',
            life: 3000
        });
    }
}

// Найти и удалить узел по ключу
function removeNodeByKey(nodes, key) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === key) {
            nodes.splice(i, 1);
            return true;
        }
        if (nodes[i].children) {
            const removed = removeNodeByKey(nodes[i].children, key);
            if (removed) return true;
        }
    }
    return false;
}

//  Открыть контекстное меню
function openContextMenu(event, node) {
    contextMenuFolder.value = node;
    contextMenu.value.show(event);
}

// Переименование папки
async function renameFolder() {
    const newName = prompt('Введите новое имя папки:', contextMenuFolder.value.data.name);
    if (!newName) return;

    try {
        const token = localStorage.getItem('authToken');
        await axios.put(
            `${apiUrl}/api/folders/${contextMenuFolder.value.data.id}`,
            { name: newName },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        await loadSurveyTree();
    } catch (error) {
        console.error('Ошибка переименования папки:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось переименовать папку',
            life: 3000
        });
    }
}

// Удаление папки
async function deleteFolder() {
    const confirmed = confirm('Удалить папку и все вложенные опросы?');
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        await axios.delete(`${apiUrl}/api/folders/${contextMenuFolder.value.data.id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        await loadSurveyTree();
    } catch (error) {
        console.error('Ошибка удаления папки:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось удалить папку',
            life: 3000
        });
    }
}

// Форматировать дату
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('ru-RU', options);
}

// Переход на страницу опроса
function goToSurvey(surveyData) {
    router.push(`/uikit/sur-data/${surveyData.id}`);
}

function onDropOnFolderWrapper(event, targetFolderNode) {
    event.stopPropagation(); // <-- Вот это ключевое!
    onDropOnFolder(targetFolderNode);
}
</script>

<template>
    <div class="card">
        <!-- если не было опросов -->
        <div style="margin: 30px" hidden>
            <h1 class="font-semibold text-4xl mb-6">Вы еще не создавали опросы</h1>
            <p class="font-semibold text-xl mb-4">Проведите свой первый опрос и вы увидите их здесь!</p>
        </div>

        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-book" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Библиотека</h2>
        </div>

        <Dialog header="Создание новой папки" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '30vw' }" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block mb-2 font-semibold">Название папки</label>
                    <InputText v-model="newFolderName" placeholder="Введите название папки" class="w-full" />
                </div>

                <div>
                    <label class="block mb-2 font-semibold">Добавить опросы</label>
                    <div class="flex flex-col gap-2" style="max-height: 200px; overflow-y: auto">
                        <div v-for="survey in freeSurveys" :key="survey.key" class="flex items-center gap-2">
                            <Checkbox v-model="selectedSurveys" :inputId="survey.key" :value="survey.key" />
                            <label :for="survey.key">{{ survey.data.name }}</label>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Отмена" severity="secondary" @click="closeCreateFolderDialog" />
                <Button label="Сохранить" @click="saveNewFolder" />
            </template>
        </Dialog>

        <div class="card flex flex-col gap-4 w-full" style="padding: initial">
            <Toolbar>
                <template #start>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText placeholder="Поиск по опросам" style="width: 100%" />
                    </IconField>
                </template>

                <template #end>
                    <Button type="button" icon="pi pi-plus" @click="openCreateFolderDialog" label="Создать папку" class="mr-2" severity="secondary" text />
                    <!-- <Button v-tooltip="'Click to proceed'" :model="items" type="button" icon="pi pi-ellipsis-v" severity="secondary" text /> -->
                </template>
            </Toolbar>
        </div>

        <!-- Папки и опросы -->
        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Папки и опросы</div>

        <ContextMenu
            ref="contextMenu"
            :model="[
                { label: 'Переименовать', icon: 'pi pi-pencil', command: renameFolder },
                { label: 'Удалить', icon: 'pi pi-trash', command: deleteFolder }
            ]"
        />

        <!-- Обёртка вокруг TreeTable для drop в "корень" -->
        <div class="tree-container" @drop="handleRootDrop" @dragover.prevent @dragenter="handleDragEnter" @dragleave="handleDragLeave" :class="{ 'drag-over': isDragOverRoot }">
            <TreeTable :value="surveyTree" selectionMode="single" v-model:selectionKeys="selectedNode">
                <Column field="name" header="Имя" :expander="true">
                    <template #body="slotProps">
                        <div
                            draggable="true"
                            @dragstart="onDragStart(slotProps.node, $event)"
                            @drop="onDropOnFolderWrapper($event, slotProps.node)"
                            @dragover.prevent
                            @dragenter.prevent
                            @contextmenu.prevent="openContextMenu($event, slotProps.node)"
                            @click.stop
                            :class="{ 'folder-item': slotProps.node.data.type === 'folder' }"
                        >
                            <i :class="slotProps.node.data.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'" />
                            {{ slotProps.node.data.name }}
                        </div>
                    </template>
                </Column>

                <Column field="modified" header="Последнее изменение">
                    <template #body="slotProps">
                        <span v-if="slotProps.node.data.modified">{{ formatDate(slotProps.node.data.modified) }}</span>
                    </template>
                </Column>

                <Column header="">
                    <template #body="slotProps">
                        <Button v-if="slotProps.node.data.type === 'survey'" @click="goToSurvey(slotProps.node.data)" icon="pi pi-chevron-right" class="back-btn" text severity="secondary" />
                    </template>
                </Column>
            </TreeTable>
        </div>
    </div>
</template>
