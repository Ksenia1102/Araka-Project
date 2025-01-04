<script setup>
import axios from 'axios'; // Для работы с запросами
import jwtDecode from 'jwt-decode';
import { onMounted, ref } from 'vue';
// import { useRouter } from 'vue-router'; // Импортируйте useRouter

// const router = useRouter(); // Получите доступ к роутеру

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
const pass = ref('*****');

// const newPassword = ref('');
// const oldPassword = ref('');
// Флаг режима редактирования
const isEditingName = ref(false);
const isEditingAuth = ref(false);
// Название кнопки
const buttonLabelName = ref('Изменить данные о пользователе');
const buttonLabelAuth = ref('Изменить данные аутентификации');
function getUserIdFromToken() {
    const token = localStorage.getItem('authToken'); // Или другой способ получения токена
    console.log(token);
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.id; // Зависит от структуры вашего токена
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return null;
    }
}
async function fetchUserData() {
    try {
        const userId = getUserIdFromToken();
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:3000/api/profile/${userId}`, {
            headers: {
                token: token // Добавляем токен в заголовки
            }
        }); // Запрос к вашему API
        const user = response.data;
        username.value = user.username || 'Имя';
        console.log(user.username);
        lastname.value = user.lastname || 'Фамилия';
        login.value = user.login || ''; // Предполагаем, что email используется как login
        pass.value = '*****'; // Пароль обычно не передается, оставляем пустым
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }
}

// Сохранение измененных данных имени и фамилии
async function saveUserData() {
    try {
        const userId = getUserIdFromToken();
        const token = localStorage.getItem('authToken');
        await axios.put(`http://localhost:3000/api/profile/${userId}`, { name: username.value, lastname: lastname.value }, { headers: { token } });
        isEditingName.value = false;
        buttonLabelName.value = 'Изменить данные о пользователе';
        console.log('Данные успешно сохранены');
    } catch (error) {
        console.error('Ошибка сохранения данных пользователя:', error);
    }
}

// Сохранение данных аутентификации
async function saveAuthData() {
    try {
        const userId = getUserIdFromToken();
        const token = localStorage.getItem('authToken');
        await axios.put(
            `http://localhost:3000/api/profile_auth/${userId}`,
            {
                login: login.value,
                password: pass.value
            },
            { headers: { token } }
        );
        isEditingAuth.value = false;
        buttonLabelAuth.value = 'Изменить данные аутентификации';
        fetchUserData();
    } catch (error) {
        console.error('Ошибка сохранения данных аутентификации:', error);
    }
}

// Функция для переключения режима для имени
function toggleEditNameMode() {
    if (isEditingName.value) {
        saveUserData(); // Сохранение изменений при выключении режима редактирования
    } else {
        isEditingName.value = true; // Включение режима редактирования
        buttonLabelName.value = 'Сохранить';
    }
}
// Функция для переключения режима для пароля\логина
function toggleEditAuthMode() {
    if (isEditingAuth.value) {
        saveAuthData(); // Сохраняем изменения
    } else {
        isEditingAuth.value = true;
        buttonLabelAuth.value = 'Сохранить';
    }
}

async function deleteAccount() {
    const userId = getUserIdFromToken();
    const token = localStorage.getItem('authToken');

    try {
        await axios.delete(`http://localhost:3000/api/profile/${userId}`, {
            headers: { token: token }
        });
        // Перенаправление пользователя на страницу логина или главную после удаления аккаунта
        window.location.replace('/auth/login'); // Замените на путь, куда нужно отправить пользователя
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
