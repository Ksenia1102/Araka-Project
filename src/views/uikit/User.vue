<script setup>
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { onMounted, ref } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL;
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
const email = ref('user@example.com'); // Добавлено поле для email
const pass = ref('*****');

const isEditingName = ref(false);
const isEditingAuth = ref(false);

const buttonLabelName = ref('Изменить данные о пользователе');
const buttonLabelAuth = ref('Изменить данные аутентификации');

function getUserIdFromToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.id;
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return null;
    }
}

async function fetchUserData() {
    try {
        const userId = getUserIdFromToken();
        const token = localStorage.getItem('authToken');

        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const response = await axios.get(`${apiUrl}/profile/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}` // Используем стандартный формат
            }
        });

        const user = response.data;
        username.value = user.name || 'Имя';
        lastname.value = user.surname || 'Фамилия';
        login.value = user.login || '';
        email.value = user.email || ''; // Получаем email из ответа сервера
        pass.value = '';
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);

        // Обработка ошибки 401
        if (error.response?.status === 401) {
            // 1. Удаляем невалидный токен
            localStorage.removeItem('authToken');

            // 2. Перенаправляем на страницу входа
            // router.push('/login');

            // 3. Показываем сообщение пользователю
            alert('Сессия истекла. Пожалуйста, войдите снова.');
        }
    }
}

async function saveUserData() {
    try {
        const userId = getUserIdFromToken();
        const token = localStorage.getItem('authToken');
        await axios.put(
            `${apiUrl}/profile/${userId}`,
            { name: username.value, surname: lastname.value },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        isEditingName.value = false;
        buttonLabelName.value = 'Изменить данные о пользователе';
        console.log('Данные успешно сохранены');
    } catch (error) {
        console.error('Ошибка сохранения данных пользователя:', error);
    }
}

async function saveAuthData() {
    try {
        const userId = getUserIdFromToken();
        const token = localStorage.getItem('authToken');
        await axios.put(
            `${apiUrl}/profile/${userId}`,
            {
                login: login.value,
                password: pass.value
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        isEditingAuth.value = false;
        buttonLabelAuth.value = 'Изменить данные аутентификации';
        fetchUserData();
    } catch (error) {
        console.error('Ошибка сохранения данных аутентификации:', error);
    }
}

function toggleEditNameMode() {
    if (isEditingName.value) {
        saveUserData();
    } else {
        isEditingName.value = true;
        buttonLabelName.value = 'Сохранить';
    }
}

function toggleEditAuthMode() {
    if (isEditingAuth.value) {
        saveAuthData();
    } else {
        isEditingAuth.value = true;
        buttonLabelAuth.value = 'Сохранить';
    }
}

async function deleteAccount() {
    const userId = getUserIdFromToken();
    const token = localStorage.getItem('authToken');

    try {
        await axios.delete(`${apiUrl}/profile/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        window.location.replace('/auth/login');
    } catch (error) {
        console.error('Ошибка удаления аккаунта:', error);
    }
}

onMounted(() => {
    fetchUserData();
});
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
        
        <!-- Поле для email (только для чтения) -->
        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Контактные данные</div>
        <div class="flex flex-wrap flex-col gap-4" style="margin-bottom: 10px; width: 50%">
            <div class="flex flex-col grow basis-0 gap-2">
                <label for="email">Электронная почта</label>
                <InputText type="text" id="email" v-model="email" disabled />
            </div>
        </div>
        
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
                <Button label="Да" icon="pi pi-check" @click="deleteAccount" severity="danger" outlined autofocus />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>