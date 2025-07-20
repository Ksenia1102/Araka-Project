<script setup>
import { defineEmits, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
const toast = useToast();

// Определяем события, которые этот компонент может генерировать
const emit = defineEmits(['folder-updated']);

// --- Состояние для диалога переименования ---
const renameDialogVisible = ref(false);
const newFolderNameForRename = ref('');
let currentFolderNode = null; // Для хранения узла папки, которую переименовываем

// --- Состояние для диалога подтверждения удаления ---
const deleteConfirmationVisible = ref(false);
let folderToDeleteNode = null; // Для хранения узла папки, которую удаляем

// --- Открытие диалога переименования ---
function openRenameDialog(node) {
    currentFolderNode = node;
    newFolderNameForRename.value = node.data.name;
    renameDialogVisible.value = true;
}

// --- Закрытие диалога переименования ---
function closeRenameDialog() {
    renameDialogVisible.value = false;
    newFolderNameForRename.value = '';
    currentFolderNode = null;
}

// --- Сохранение переименованной папки ---
async function saveRenamedFolder() {
    if (!newFolderNameForRename.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Введите новое имя папки',
            life: 3000
        });
        return;
    }

    if (!currentFolderNode) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Папка для переименования не выбрана.', life: 3000 });
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        await axios.put(
            `${apiUrl}/api/folders/${currentFolderNode.data.id}`,
            { name: newFolderNameForRename.value },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Папка успешно переименована',
            life: 3000
        });
        closeRenameDialog();
        emit('folder-updated'); // Сообщаем родительскому компоненту об изменении
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

// --- Открытие диалога подтверждения удаления ---
function openDeleteConfirmation(node) {
    folderToDeleteNode = node;
    deleteConfirmationVisible.value = true;
}

// --- Закрытие диалога подтверждения удаления ---
function closeDeleteConfirmation() {
    deleteConfirmationVisible.value = false;
    folderToDeleteNode = null;
}

// --- Подтверждение и выполнение удаления папки ---
async function confirmFolderDeletion() {
    if (!folderToDeleteNode) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Папка для удаления не выбрана.', life: 3000 });
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        // loading.show('Удаление папки...');
        await axios.delete(`${apiUrl}/api/folders/${folderToDeleteNode.data.id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Папка успешно удалена',
            life: 3000
        });
        closeDeleteConfirmation();
        emit('folder-updated'); // Сообщаем родительскому компоненту об изменении
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

// Делаем функции доступными для родительского компонента
defineExpose({
    openRenameDialog,
    openDeleteConfirmation
});
</script>

<template>
    <Dialog header="Переименовать папку" v-model:visible="renameDialogVisible" :style="{ width: '30vw' }" :modal="true" @hide="closeRenameDialog">
        <div class="flex flex-col gap-4">
            <div>
                <label class="block mb-2 font-semibold">Новое имя папки</label>
                <InputText v-model="newFolderNameForRename" placeholder="Введите новое название" class="w-full" @keyup.enter="saveRenamedFolder" />
            </div>
        </div>
        <template #footer>
            <Button label="Отмена" severity="secondary" @click="closeRenameDialog" />
            <Button label="Сохранить" severity="info" @click="saveRenamedFolder" />
        </template>
    </Dialog>

    <Dialog header="Подтверждение удаления папки" v-model:visible="deleteConfirmationVisible" :style="{ width: '350px' }" :modal="true" @hide="closeDeleteConfirmation">
        <div class="flex items-center justify-center">
            <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem; color: #f59e0b;" />
            <span>Вы действительно хотите удалить папку <strong>{{ folderToDeleteNode?.data?.name }}</strong>? Все вложенные тесты также будут удалены.</span>
        </div>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" @click="closeDeleteConfirmation" text severity="secondary"/>
            <Button label="Удалить" icon="pi pi-check" @click="confirmFolderDeletion" severity="danger" outlined autofocus />
        </template>
    </Dialog>
</template>
