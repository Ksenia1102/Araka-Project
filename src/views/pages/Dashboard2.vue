<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const surveyTree = ref([
    {
        key: '0',
        data: { name: 'Рабочие опросы', type: 'folder', modified: null },
        children: [
            {
                key: '0-0',
                data: { name: 'Опрос HR', type: 'survey', modified: '2024-04-24' }
            },
            {
                key: '0-1',
                data: { name: 'Опрос tt', type: 'survey', modified: '2024-04-24' }
            }
        ]
    },
    {
        key: '1',
        data: { name: 'Опрос вне папки', type: 'survey', modified: '2024-04-20' }
    },
    {
        key: '2',
        data: { name: 'Опрос вне папки', type: 'survey', modified: '2024-04-20' }
    },
    {
        key: '3',
        data: { name: 'Рабочее', type: 'folder', modified: null }
    }
]);

const selectedNode = ref(null);
const draggedNode = ref(null); // сюда кладем весь узел
const contextMenu = ref();
const contextMenuFolder = ref(null);
const display = ref(false); // видимость модалки
const newFolderName = ref('');
const freeSurveys = ref([]); // опросы без папок
const selectedSurveys = ref([]); // выбранные опросы в модалке
const router = useRouter();

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
function saveNewFolder() {
    if (!newFolderName.value.trim()) {
        alert('Введите имя папки');
        return;
    }

    // Формируем новую папку
    const newFolder = {
        key: Date.now().toString(),
        data: {
            name: newFolderName.value,
            type: 'folder',
            modified: new Date()
        },
        children: []
    };

    // Переносим выбранные опросы в новую папку
    selectedSurveys.value.forEach((surveyId) => {
        const surveyIndex = surveyTree.value.findIndex((node) => node.key === surveyId);
        if (surveyIndex !== -1) {
            newFolder.children.push(surveyTree.value[surveyIndex]);
            surveyTree.value.splice(surveyIndex, 1); // удаляем из корня
        }
    });

    surveyTree.value.push(newFolder);

    sortSurveyTree(surveyTree.value); // сортируем, чтобы папки были выше

    closeCreateFolderDialog();
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
function onDragStart(node) {
    draggedNode.value = node;
}

// Когда бросили на папку
function onDropOnFolder(targetFolderNode) {
    if (draggedNode.value && targetFolderNode.data.type === 'folder') {
        moveNodeIntoFolder(draggedNode.value, targetFolderNode);
        draggedNode.value = null;
    }
}

// Когда бросили в пустое пространство ("корень")
function onDropOnRoot() {
    if (draggedNode.value) {
        moveNodeToRoot(draggedNode.value);
        draggedNode.value = null;
    }
}

// Переместить узел в папку
function moveNodeIntoFolder(dragged, targetFolder) {
    // Убираем из старого места
    removeNodeByKey(surveyTree.value, dragged.key);
    // Добавляем в папку
    if (!targetFolder.children) {
        targetFolder.children = [];
    }
    targetFolder.children.push(dragged);
}

// Переместить узел в корень дерева
function moveNodeToRoot(dragged) {
    // Убираем из старого места
    removeNodeByKey(surveyTree.value, dragged.key);
    // Добавляем в корень
    surveyTree.value.push(dragged);
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

// Переименовать папку
function renameFolder() {
    const newName = prompt('Введите новое имя папки:', contextMenuFolder.value.data.name);
    if (newName) {
        contextMenuFolder.value.data.name = newName;
    }
}

// Удалить папку (или опрос)
function deleteFolder() {
    const confirmed = confirm('Удалить папку и все вложенные опросы?');
    if (confirmed) {
        removeNodeByKey(surveyTree.value, contextMenuFolder.value.key);
    }
}

// Форматировать дату
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('ru-RU', options);
}

// Переход на страницу опроса
function goToSurvey() {
    router.push(`/uikit/sur-data`);
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

        <TreeTable :value="surveyTree" selectionMode="single" v-model:selectionKeys="selectedNode" @drop.prevent="onDropOnRoot" @dragover.prevent>
            <Column field="name" header="Имя" :expander="true">
                <template #body="slotProps">
                    <div draggable="true" @dragstart="onDragStart(slotProps.node)" @drop.prevent="onDropOnFolder(slotProps.node)" @dragover.prevent @contextmenu.prevent="openContextMenu($event, slotProps.node)">
                        <i v-if="slotProps.node.data.type === 'folder'" class="pi pi-folder mr-2" />
                        <i v-else class="pi pi-file mr-2" />
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
                    <Button v-if="slotProps.node.data.type === 'survey'" @click="goToSurvey(slotProps.node.data.name)" icon="pi pi-chevron-right" class="back-btn" text severity="secondary" />
                </template>
            </Column>
        </TreeTable>
    </div>
</template>
