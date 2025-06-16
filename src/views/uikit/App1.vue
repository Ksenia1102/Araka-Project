<script setup>
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
const toast = useToast();
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
            toast.add({
                severity: 'warn',
                summary: 'Внимание',
                detail: 'Сессия истекла. Пожалуйста, войдите снова.',
                life: 3000
            });
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
    <div class="card" style="text-align: center">
        <h2 class="text-2xl font-semibold mb-6">Скачать android-приложение</h2>

        <!-- Место для фото -->
        <div class="qr-block">
            <img src="/code.svg" alt="Фото приложения" class="qr-img" />
        </div>

        <!-- Ссылка на скачивание -->
        <a href="https://drive.google.com/drive/folders/1a09gKrW9MjrzQg1iGu0-9KTZiJLbpAGW?usp=drive_link" target="_blank" rel="noopener noreferrer" class="link-dow"> Скачать приложение </a>
    </div>
</template>
<style scoped></style>
