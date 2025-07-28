<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, inject, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import FolderDialogs from './FolderDialogs.vue';

const apiUrl = import.meta.env.VITE_API_URL;
const toast = useToast();
const router = useRouter();
const hasSurveys = ref(false);
const loading = inject('loading');
// Ссылка на компонент диалогов
const folderDialogsRef = ref(null);

// const surveyTree = ref([
//     {
//         key: '0',
//         data: { name: 'Рабочие тесты', type: 'folder', modified: null },
//         children: [
//             {
//                 key: '0-0',
//                 data: { name: 'тест HR', type: 'survey', modified: '2024-04-24' }
//             },
//             {
//                 key: '0-1',
//                 data: { name: 'тест tt', type: 'survey', modified: '2024-04-24' }
//             }
//         ]
//     },
//     {
//         key: '1',
//         data: { name: 'тест вне папки', type: 'survey', modified: '2024-04-20' }
//     },
//     {
//         key: '2',
//         data: { name: 'тест вне папки', type: 'survey', modified: '2024-04-20' }
//     },
//     {
//         key: '3',
//         data: { name: 'Рабочее', type: 'folder', modified: null }
//     }
// ]);
const surveyTree = ref([]); // Теперь это будет заполняться из API
const searchQuery = ref('');

function openNewTab() {
    router.push(`/pages/survey`);
}

// Загрузка тестов без папок
async function loadUnfolderedSurveys() {
    try {
        const token = localStorage.getItem('authToken');
        console.log(token);
        loading.show('Загрузка данных...');
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
        console.error('Ошибка загрузки тестов без папок:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить тесты без папок',
            life: 3000
        });
        return [];
    } finally {
        loading.hide(); // Скрываем индикатор
    }
}

const filteredTree = computed(() => {
    if (!searchQuery.value) return surveyTree.value;

    const filterNode = (node) => {
        const matches = node.data.name.toLowerCase().includes(searchQuery.value.toLowerCase());

        const filteredChildren = node.children ? node.children.map(filterNode).filter(Boolean) : [];

        if (matches || filteredChildren.length) {
            return {
                ...node,
                children: filteredChildren
            };
        }
        return null;
    };

    return surveyTree.value.map(filterNode).filter(Boolean);
});
const hadFoldersInitially = ref(false);
// Загрузка данных с сервера
async function loadSurveyTree() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('TOKEEN', token);

        // Загружаем параллельно папки и тесты без папок
        const [foldersRes, unfolderedSurveys] = await Promise.all([
            axios.get(`${apiUrl}/api/folders`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            loadUnfolderedSurveys()
        ]);

        // Преобразуем папки
        const folders = transformApiData(foldersRes.data);
        console.log(folders)
        console.log(hadFoldersInitially)
        // Сохраняем, были ли папки до создания новой
        if (!hadFoldersInitially.value) {
            hadFoldersInitially.value = folders.length > 0;
        }

        // Объединяем: папки + тесты без папок (после папок)
        surveyTree.value = [...folders, ...unfolderedSurveys];

        // Проверяем, есть ли хотя бы одна папка или один тест
        hasSurveys.value = surveyTree.value.length > 0;

        // Сортировка: папки сверху, тесты снизу (на всякий случай)
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
const freeSurveys = ref([]); // тесты без папок
const selectedSurveys = ref([]); // выбранные тесты в модалке
const showFirstFolderHint = ref(false);
const firstFolderRef = ref(null);

// const router = useRouter();

// открытие модалки
function openCreateFolderDialog() {
    updateFreeSurveys(); // при открытии обновим список свободных тестов
    display.value = true;
}
// закрытие модалки
function closeCreateFolderDialog() {
    display.value = false;
    newFolderName.value = '';
    selectedSurveys.value = [];
}
// Функция обновления списка свободных тестов
// (берем только те тесты, что лежат в корне, без папок)
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
        loading.show('Создание папки...');

        // Сохраняем, были ли папки до создания новой
        const hadFoldersBefore = surveyTree.value.some((node) => node.data.type === 'folder');

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
        await nextTick(); // убедимся, что дерево перерисовано

        // Показываем подсказку только если папок не было до этого, а теперь они есть
        if (!hadFoldersBefore) {
            const firstFolderNode = surveyTree.value.find((node) => node.data.type === 'folder');
            if (firstFolderNode) {
                firstFolderRef.value = firstFolderNode.key;
                showFirstFolderHint.value = true;
            }
        }

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

// сортировка папок перед тестами
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

// Когда начали перетаскивать тест или папку
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
// Перемещение теста в папку
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
        console.error('Ошибка перемещения теста:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось переместить тест',
            life: 3000
        });
    }
}

const isDragOverRoot = ref(false);

function handleRowDoubleClick(node) {
    if (node.data.type === 'survey') {
        this.goToSurvey(node.data);
    }
}

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

// Перемещение теста в корень
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
            detail: 'Тест перемещён в корень',
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка перемещения:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось переместить тест',
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

// Функции для контекстного меню, они вызывают методы дочернего компонента
function callRenameDialog() {
    if (folderDialogsRef.value && contextMenuFolder.value) {
        folderDialogsRef.value.openRenameDialog(contextMenuFolder.value);
    }
}

function callDeleteConfirmation() {
    if (folderDialogsRef.value && contextMenuFolder.value) {
        folderDialogsRef.value.openDeleteConfirmation(contextMenuFolder.value);
    }
}



// // Переименование папки
// async function renameFolder() {
//     const newName = prompt('Введите новое имя папки:', contextMenuFolder.value.data.name);
//     if (!newName) return;

//     try {
//         const token = localStorage.getItem('authToken');
//         await axios.put(
//             `${apiUrl}/api/folders/${contextMenuFolder.value.data.id}`,
//             { name: newName },
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             }
//         );

//         await loadSurveyTree();
//     } catch (error) {
//         console.error('Ошибка переименования папки:', error);
//         toast.add({
//             severity: 'error',
//             summary: 'Ошибка',
//             detail: 'Не удалось переименовать папку',
//             life: 3000
//         });
//     }
// }

// // Удаление папки
// async function deleteFolder() {
//     const confirmed = confirm('Удалить папку и все вложенные тесты?');
//     if (!confirmed) return;

//     try {
//         const token = localStorage.getItem('authToken');
//         await axios.delete(`${apiUrl}/api/folders/${contextMenuFolder.value.data.id}`, {
//             headers: {
//                 Authorization: `Bearer ${token}`
//             }
//         });

//         await loadSurveyTree();
//     } catch (error) {
//         console.error('Ошибка удаления папки:', error);
//         toast.add({
//             severity: 'error',
//             summary: 'Ошибка',
//             detail: 'Не удалось удалить папку',
//             life: 3000
//         });
//     }
// }

// Форматировать дату
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('ru-RU', options);
}

// Переход на страницу теста
function goToSurvey(surveyData) {
    router.push(`/uikit/sur-data/${surveyData.id}`);
}

function onDropOnFolderWrapper(event, targetFolderNode) {
    event.stopPropagation(); // <-- Вот это ключевое!
    onDropOnFolder(targetFolderNode);
}

</script>

<template>
    <div class="card start">
        <div v-if="!hasSurveys" class="start">
            <div style="margin: 30px">
                <h1 class="font-semibold text-4xl mb-6">У вас еще нет тестов в библиотеке</h1>
                <p class="font-semibold text-xl mb-4">Создайте свой первый тест</p>
                <Button label="Создать тест" @click="openNewTab" severity="info" icon="pi pi-plus" />
            </div>
        </div>

        <div v-else>
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
                        <label class="block mb-2 font-semibold">Добавить тест</label>
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
                    <Button label="Сохранить" severity="info" @click="saveNewFolder" />
                </template>
            </Dialog>

            <div class="card flex flex-col gap-4 w-full" style="padding: initial">
                <Toolbar>
                    <template #start>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="searchQuery" placeholder="Поиск по тестам" style="width: 100%" />
                        </IconField>
                    </template>

                    <template #end>
                        <Button type="button" icon="pi pi-plus" @click="openCreateFolderDialog" label="Создать папку" class="mr-2" severity="secondary" text />
                    </template>
                </Toolbar>
            </div>

            <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Папки и тесты</div>

            <ContextMenu
                ref="contextMenu"
                :model="[
                    { label: 'Переименовать', icon: 'pi pi-pencil', command: callRenameDialog },
                    { label: 'Удалить', icon: 'pi pi-trash', command: callDeleteConfirmation }
                ]"
            />

            <div class="tree-container" @drop="handleRootDrop" @dragover.prevent @dragenter="handleDragEnter" @dragleave="handleDragLeave" :class="{ 'drag-over': isDragOverRoot }" style="min-height: 200px; padding-bottom: 30px">
                <TreeTable :value="filteredTree" selectionMode="single" v-model:selectionKeys="selectedNode" class="no-padding-table" @rowDblclick="onRowDoubleClick">
                    <Column field="name" header="Название" :expander="true">
                        <template #body="slotProps">
                            <div class="item-wrapper"
                                draggable="true"
                                @dragstart="onDragStart(slotProps.node, $event)"
                                @drop="onDropOnFolderWrapper($event, slotProps.node)"
                                @dragover.prevent
                                @dragenter.prevent
                                @contextmenu.prevent="slotProps.node.data.type === 'folder' && openContextMenu($event, slotProps.node)"
                                @click.stop
                                @dblclick="handleRowDoubleClick(slotProps.node)"
                            >
                                <div
                                    :class="['item-content', slotProps.node.data.type === 'folder' ? 'folder-item' : 'survey-item']"
                                    :ref="slotProps.node.key === firstFolderRef ? 'firstFolderElement' : null"
                                >
                                    <i :class="slotProps.node.data.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'" />
                                    {{ slotProps.node.data.name }}
                                    <!-- Подсказка -->
                                    <div
                                        v-if="showFirstFolderHint && slotProps.node.key === firstFolderRef"
                                        class="tooltip-overlay"
                                    >
                                        <div class="tooltip-box">
                                            <div class="tooltip-title">Подсказка</div>
                                            Нажмите правой кнопкой на папку, чтобы переименовать или удалить
                                            <Button label="Понятно" class="mt-2 confirm-button" size="medium" @click="showFirstFolderHint = false" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="modified" header="Последнее изменение">
                        <template #body="slotProps">
                            <div class="item-wrapper">
                                <span v-if="slotProps.node.data.modified" class="item-content">
                                    {{ formatDate(slotProps.node.data.modified) }}
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column header="">
                        <template #body="slotProps">
                            <div class="item-wrapper">
                                <Button
                                    v-if="slotProps.node.data.type === 'survey'"
                                    @click="goToSurvey(slotProps.node.data)"
                                    icon="pi pi-chevron-right"
                                    class="back-btn"
                                    text
                                    severity="secondary"
                                />
                            </div>
                        </template>
                    </Column>
                </TreeTable>
            </div>
            <FolderDialogs ref="folderDialogsRef" @folder-updated="loadSurveyTree" />
        </div>
    </div>
</template>


<style>

.no-padding-table .p-treetable-tbody > tr > td {
    padding: 0 !important;
}

.folder-item {
    padding: 0.5rem 1rem;
    display: inline-block;
}

.tree-container ::v-deep(.p-treetable-tbody) td {
    padding: 0 !important;
}

.item-wrapper {
    width: 100%;
    height: 100%;
    padding: 0.5rem 1rem;
    cursor: pointer;
}

.item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.back-btn {
    padding: 0 !important;
    margin: 0.5rem 1rem;
}
.tooltip-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(2px);
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tooltip-box {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    width: 400px;
    max-width: 90vw;
    text-align: center;
    font-size: 1.1rem;
    line-height: 1.5;
}

.tooltip-title {
    font-weight: bold;
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #333;
}

.tooltip-text {
    margin-bottom: 1.5rem;
}

.tooltip-box .p-button {
    display: block;
    margin-left: auto;
    margin-right: auto;
}

.confirm-button {
    font-size: 1.1rem;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-top: 1.5rem;
}


</style>
