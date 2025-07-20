<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';


const props = defineProps({
    apiUrl: {
        type: String,
        required: true
    }
});

// Emit event with the deleted class ID
const emit = defineEmits(['deleted']);

const toast = useToast();
const visible = ref(false);
const currentClassId = ref('');
const currentClassName = ref(''); // Added to store the class name for display

const open = (classId, className) => {
    currentClassId.value = classId;
    currentClassName.value = className; // Set the class name when opening
    visible.value = true;
};

const close = () => {
    visible.value = false;
};

const confirmDelete = async () => {
    try {
        const token = localStorage.getItem('authToken');
        await axios.delete(`${props.apiUrl}/api/classes/${currentClassId.value}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        toast.add({
            severity: 'success',
            summary: 'Успех!',
            detail: 'Класс успешно удалён.',
            life: 3000
        });

        // Emit the ID of the deleted class
        emit('deleted', currentClassId.value);

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: error.response?.data?.error || 'Не удалось удалить класс',
            life: 3000
        });
    } finally {
        close();
    }
};

defineExpose({
    open,
    close
});
</script>

<template>
    <Dialog header="Подтверждение удаления" v-model:visible="visible" :style="{ width: '350px' }" :modal="true">
        <div class="flex items-center justify-center">
            <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem; color: red;" />
            <span>Вы действительно хотите удалить класс <strong>{{currentClassName.length > 30 ? currentClassName.substring(0, 30) + '...' : currentClassName}}</strong>? Все связанные данные будут удалены безвозвратно.</span>
        </div>
        <template #footer>
            <Button label="Отмена" icon="pi pi-times" @click="close" text severity="secondary" />
            <Button label="Удалить" icon="pi pi-check" @click="confirmDelete" severity="danger" outlined autofocus/>
        </template>
    </Dialog>
</template>
