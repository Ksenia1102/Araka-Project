<script setup>
import axios from 'axios';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const apiUrl = import.meta.env.VITE_API_URL;
const router = useRouter();
const currentQuestion = ref(null);
const surveyInfo = ref(null);
const noActiveSurvey = ref(true);
const isLoading = ref(true);
const errorMessage = ref('');
let intervalId = null;

const getToken = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || localStorage.getItem('authToken');
};

async function fetchCurrentQuestion() {
    try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${apiUrl}/api/conducting/current`, {
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.active) {
            console.log(response.data);
            currentQuestion.value = {
                ...response.data,
                mediaUrl: response.data.file_url,
                mediaType: response.data.file_type
            };

            surveyInfo.value = {
                title: response.data.title,
                class: response.data.class_name,
                survey_id: response.data.survey_id,
                class_id: response.data.class_id,
                mediaUrl: response.data.file_url,
                mediaType: response.data.file_type
            };
            noActiveSurvey.value = false;
            errorMessage.value = '';
        } else {
            noActiveSurvey.value = true;
            errorMessage.value = 'Активный тест не найден';
        }
    } catch (error) {
        console.error('Error fetching current question:', error);
        noActiveSurvey.value = true;

        if (error.response?.status === 401) {
            errorMessage.value = 'Ошибка авторизации';
            localStorage.removeItem('authToken');
        } else {
            errorMessage.value = 'Ошибка при загрузке данных';
        }
    } finally {
        isLoading.value = false;
    }
}

async function stopSurvey() {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Требуется авторизация');
        }

        const response = await axios.post(
            `${apiUrl}/api/conducting/stop`,
            {
                survey_id: surveyInfo.value.survey_id,
                class_id: surveyInfo.value.class_id
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.status === 'success') {
            // Обновляем состояние
            noActiveSurvey.value = true;
            errorMessage.value = 'Тест остановлен';
            currentQuestion.value = null;

            // Останавливаем опрос сервера
            stopPolling();

            // Через 2 секунды снова запускаем опрос
            setTimeout(startPolling, 2000);
        }
    } catch (error) {
        console.error('Ошибка при остановке теста:', error);
        // Добавьте проверку на 401 ошибку
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            errorMessage.value = 'Сессия истекла. Авторизуйтесь снова.';
            router.push('/login'); // Перенаправление на логин
        } else {
            errorMessage.value = 'Ошибка при остановке теста';
        }
    }
}

function startPolling() {
    // Проверяем каждые 3 секунды
    intervalId = setInterval(fetchCurrentQuestion, 3000);
}

function stopPolling() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

onMounted(async () => {
    // ✅ Сохраняем токен из URL в localStorage, если есть
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
        localStorage.setItem('authToken', tokenFromUrl);

        // (необязательно) можно очистить query-параметр в адресной строке
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
    }

    isLoading.value = true;
    await fetchCurrentQuestion();
    startPolling();

    // Слушаем внешние сообщения (например, с другой вкладки)
    window.addEventListener('message', (event) => {
        if (event.data.type === 'survey_update') {
            if (event.data.data) {
                currentQuestion.value = event.data.data;
                surveyInfo.value = {
                    title: event.data.data.title,
                    class: event.data.data.class_name,
                    survey_id: event.data.data.survey_id,
                    class_id: event.data.data.class_id
                };
                noActiveSurvey.value = false;
                errorMessage.value = '';
            } else {
                noActiveSurvey.value = true;
                errorMessage.value = 'Тест завершен';
            }
        }
    });
});

onUnmounted(() => {
    stopPolling();
    window.removeEventListener('message');
});
</script>

<template>
    <div class="card p-4">
        <div v-if="isLoading" class="flex justify-content-center">
            <ProgressSpinner />
        </div>

        <div v-else-if="noActiveSurvey || errorMessage" class="text-center p-4">
            <i class="pi pi-info-circle" style="font-size: 2rem"></i>
            <h2>{{ errorMessage || 'Активный тест не найден' }}</h2>
            <p v-if="!errorMessage">Сначала запустите тест с мобильного приложения</p>
            <p class="text-sm">Страница автоматически обновится при запуске теста</p>
        </div>

        <div v-else class="demo-container">
            <div class="survey-header">
                <h2>{{ surveyInfo.title }}</h2>
                <p>Класс: {{ surveyInfo.class }}</p>
            </div>

            <div class="question-container">
                <h3>Текущий вопрос:</h3>
                <p class="question-text">{{ currentQuestion.question_text }}</p>

                <div v-if="surveyInfo.mediaUrl" class="image-preview">
                    <template v-if="surveyInfo.mediaType === 'image'">
                        <img :src="surveyInfo.mediaUrl" alt="Загруженное изображение" class="uploaded-image" />
                    </template>

                    <template v-else-if="surveyInfo.mediaType === 'video'">
                        <video :src="surveyInfo.mediaUrl" controls class="uploaded-image"></video>
                    </template>

                    <template v-else-if="surveyInfo.mediaType === 'audio'">
                        <audio :src="surveyInfo.mediaUrl" controls class="uploaded-image"></audio>
                    </template>
                </div>

                <div class="options-grid">
                    <div v-for="(option, key) in currentQuestion.options" :key="key" class="option-item">
                        <span class="option-key">{{ key }}:</span>
                        <span class="option-text">{{ option }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Стили остаются без изменений */
.demo-container {
    max-width: 800px;
    margin: 0 auto;
}

.survey-header {
    text-align: center;
    margin-bottom: 2rem;
    position: relative;
}

.question-container {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.question-text {
    font-size: 1.25rem;
    margin: 1rem 0;
}

.options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1.5rem;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--surface-ground);
    border-radius: 8px;
}

.option-key {
    font-weight: bold;
    color: var(--primary-color);
}

.text-sm {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}
</style>
