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
let ws = null;

const getToken = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || localStorage.getItem('authToken');
};

const students = ref([]);

async function fetchStudents() {
    const token = getToken();
    if (!token) {
        console.error('Токен авторизации отсутствует');
        return;
    }

    if (!surveyInfo.value?.class_id) {
        console.error('class_id не определён');
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
        const res = await axios.get(`${apiUrl}/api/conducting/students?class_id=${surveyInfo.value.class_id}`, { headers });
        students.value = res.data.data || [];
    } catch (err) {
        console.error('Ошибка при загрузке студентов:', err);
        students.value = [];
    }
}

function initWebSocket() {
    const token = getToken();
    if (!token) {
        errorMessage.value = 'Требуется авторизация';
        return;
    }

    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const apiHost = new URL(apiUrl).host;
    const wsUrl = `${wsProtocol}://${apiHost}/?token=${token}&clientType=web`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token: token }));
    };

    ws.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message.type === 'session_started' || message.type === 'survey_update') {
                const data = message.data;
                currentQuestion.value = data;
                surveyInfo.value = {
                    title: data.title,
                    class: data.class_name,
                    class_id: data.class_id,
                    mediaUrl: data.file_url,
                    mediaType: data.file_type
                };
                noActiveSurvey.value = false;
                errorMessage.value = '';
                isLoading.value = false;
                await fetchStudents();
            }

            if (message.type === 'session_stopped') {
                noActiveSurvey.value = true;
                currentQuestion.value = null;
                errorMessage.value = 'Тест остановлен';
                isLoading.value = false;
            }
        } catch (e) {
            console.error('Ошибка разбора WS сообщения:', e);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
        errorMessage.value = 'Ошибка соединения';
        isLoading.value = false;
    };
}

async function fetchCurrentQuestion() {
    try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(`${apiUrl}/api/conducting/current`, { headers });

        if (res.data.active) {
            currentQuestion.value = res.data;
            surveyInfo.value = {
                title: res.data.title,
                class: res.data.class_name,
                class_id: res.data.class_id,
                mediaUrl: res.data.file_url,
                mediaType: res.data.file_type
            };
            noActiveSurvey.value = false;
            await fetchStudents();
        } else {
            noActiveSurvey.value = true;
            errorMessage.value = 'Активный тест не найден';
        }
    } catch (error) {
        console.error('Ошибка:', error);
        noActiveSurvey.value = true;
        errorMessage.value = 'Ошибка загрузки данных';
    } finally {
        isLoading.value = false;
    }
}

onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
        localStorage.setItem('authToken', tokenFromUrl);
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
    }

    isLoading.value = true;
    await fetchCurrentQuestion();
    initWebSocket();
});

onUnmounted(() => {
    if (ws) ws.close();
});
</script>

<template>
    <div class="card p-4" style="display: contents">
        <div v-if="isLoading" class="flex justify-content-center">
            <ProgressSpinner />
        </div>

        <div v-else-if="noActiveSurvey || errorMessage" class="text-center p-4">
            <i class="pi pi-info-circle" style="font-size: 2rem"></i>
            <h2>{{ errorMessage || 'Активный тест не найден' }}</h2>
            <p class="text-sm">Страница обновится при запуске теста</p>
        </div>

        <div v-else class="flex h-screen">
            <!-- Левая колонка: Участники -->
            <div class="w-1/5 p-4 overflow-y-auto border-r border-gray-300 bg-white students-container">
                <p class="text-sm text-gray-500 class question-text">Класс {{ surveyInfo.class }}</p>
                <h3 class="text-lg font-semibold mb-4 question-text">Участники</h3>
                <div v-if="students.length === 0" class="text-gray-500">Нет участников</div>
                <ul class="students" v-else>
                    <div class="need-border">
                        <!-- <li v-for="student in students" :key="student.id" class="student mb-2">
                            {{ student.name }}
                            <span class="text-sm text-gray-500 aruco">Aruco № {{ student.aruco_num }}</span>
                        </li> -->
                        <li v-for="student in students" :key="student.id" class="student-row mb-5">
                            <span class="student-name">{{ student.name }}</span>
                            <span class="aruco-num"> {{ student.aruco_num }}</span>
                        </li>
                    </div>
                </ul>
            </div>

            <!-- Основная колонка: Вопрос -->
            <div class="w-4/5 p-6 overflow-y-auto bg-gray-50 big-container">
                <div class="survey-header text-center mb-6">
                    <h2 class="font-bold survey-title">{{ surveyInfo.title }}</h2>
                </div>

                <div class="question-container" style="min-height: 80vh">
                    <h3 class="font-semibold text-xl mb-2">Текущий вопрос:</h3>
                    <div class="question-img">
                        <h2 class="question-text mb-4" style="font-size: 2.2em">{{ currentQuestion.question_text }}</h2>

                        <div v-if="surveyInfo.mediaUrl" class="image-preview">
                            <img v-if="surveyInfo.mediaType === 'image'" :src="surveyInfo.mediaUrl" class="uploaded-image" />
                            <video v-else-if="surveyInfo.mediaType === 'video'" :src="surveyInfo.mediaUrl" controls class="uploaded-image" />
                        </div>
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
    </div>
</template>

<style scoped></style>
