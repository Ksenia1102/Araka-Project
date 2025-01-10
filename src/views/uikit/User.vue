<script setup>
import { ref } from 'vue';
const displayConfirmation = ref(false);
function openConfirmation() {
    displayConfirmation.value = true;
}

function closeConfirmation() {
    displayConfirmation.value = false;
}

// Начальные данные
const username = ref('Иван');
const lastname = ref('Конов');
const login = ref('ivanov@ex.com');
const pass = ref('123');

// Флаг режима редактирования
const isEditingName = ref(false);
const isEditingAuth = ref(false);

// Название кнопки
const buttonLabelName = ref('Изменить данные о пользователе');
const buttonLabelAuth = ref('Изменить данные аутентификации');

// Функция для переключения режима для имени
function toggleEditNameMode() {
    isEditingName.value = !isEditingName.value; // Переключаем флаг
    buttonLabelName.value = isEditingName.value ? 'Сохранить' : 'Изменить данные о пользователе'; // Меняем текст кнопки
}
// Функция для переключения режима для пароля\логина
function toggleEditAuthMode() {
    isEditingAuth.value = !isEditingAuth.value; // Переключаем флаг
    buttonLabelAuth.value = isEditingAuth.value ? 'Сохранить' : 'Изменить данные аутентификации'; // Меняем текст кнопки
}
</script>

<template>
    <div class="card">
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-user" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Имя Фамилия</h2>
        </div>

        <!-- Поля для имени и фамилии -->
        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Данные о пользователе</div>
        <div class="flex flex-wrap flex-col gap-4" style="margin-bottom: 10px; width: 50%">
            <div class="flex flex-col grow basis-0 gap-2">
                <label for="name">Имя</label>
                <InputText type="text" placeholder="Какое-то имя" id="username" v-model="username" :disabled="!isEditingName" />
            </div>
            <div class="flex flex-col grow basis-0 gap-2">
                <label for="lastName">Фамилия</label>
                <InputText type="text" placeholder="Какая-то фамилия" id="lastname" v-model="lastname" :disabled="!isEditingName" />
            </div>
        </div>
        <Button severity="info" :label="buttonLabelName" @click="toggleEditNameMode" style="margin-bottom: 10px" outlined></Button>

        <!-- Поля для логина и пароля -->
        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Пароль и аутентификация</div>
        <div class="flex flex-wrap flex-col gap-4" style="margin-bottom: 10px; width: 50%">
            <div class="flex flex-col grow basis-0 gap-2">
                <label for="login">Логин</label>
                <InputText type="text" placeholder="Какой-то логин" id="login" v-model="login" :disabled="!isEditingAuth" />
            </div>
            <div class="flex flex-col grow basis-0 gap-2">
                <label for="pass">Пароль</label>
                <InputText type="text" placeholder="Какой-то пароль" id="pass" v-model="pass" :disabled="!isEditingAuth" />
            </div>
        </div>
        <Button severity="info" :label="buttonLabelAuth" @click="toggleEditAuthMode" style="margin-bottom: 10px" outlined></Button>

        <!-- Кнопка удаления аккаунта -->
        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Другие действия</div>
        <Button severity="danger" style="margin-bottom: 10px" @click="openConfirmation" outlined>Удалить аккаунт</Button>
        <Dialog header="Предупреждение" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
            <div class="flex items-center justify-center">
                <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
                <span>Вы действительно хотите удалить этот аккаунт?</span>
            </div>
            <template #footer>
                <Button label="Нет" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
                <Button label="Да" icon="pi pi-check" @click="closeConfirmation" severity="danger" outlined autofocus />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
