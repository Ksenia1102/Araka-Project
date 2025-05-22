<script setup>
import SurveyLayout from '@/layout/SurveyLayout.vue';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const apiUrl = import.meta.env.VITE_API_URL;
const toast = useToast();
const router = useRouter();
const route = useRoute();

// STATE
const surveyTitle = ref('');
const questions = ref([]);
const currentQuestionIndex = ref(null);
const currentQuestionText = ref('');
const responseMessage = ref('');
const responseClass = ref('');
const userId = ref(null);

// COMPUTED
const currentQuestion = computed(() => {
    if (currentQuestionIndex.value !== null) {
        const question = questions.value[currentQuestionIndex.value];
        return {
            ...question,
            indexedText: `${currentQuestionIndex.value + 1}. ${question.text}`
        };
    }
    return null;
});

// METHODS

function goBack() {
    router.push('/pages/dashboard');
}

function selectQuestion(index) {
    currentQuestionIndex.value = index;
    currentQuestionText.value = questions.value[index].text;
}

function addQuestion() {
    const newQuestion = {
        text: `Вопрос ${questions.value.length + 1}`,
        options: ['', '', '', ''],
        selectedOption: null
    };
    questions.value.push(newQuestion);
    selectQuestion(questions.value.length - 1);
}

function copyQuestion(index) {
    const questionToCopy = questions.value[index];
    const copiedQuestion = {
        ...JSON.parse(JSON.stringify(questionToCopy)),
        text: `${questionToCopy.text} (Копия)`
    };
    questions.value.push(copiedQuestion);
    selectQuestion(questions.value.length - 1);
}

function deleteQuestion(index) {
    questions.value.splice(index, 1);
    if (questions.value.length === 0) {
        currentQuestionIndex.value = null;
        addQuestion();
    } else {
        currentQuestionIndex.value = Math.min(index, questions.value.length - 1);
    }
}

function selectOption(index) {
    if (currentQuestion.value) {
        questions.value[currentQuestionIndex.value].selectedOption = index;
    }
}

const fileInput = ref(null);
function triggerFileInput() {
    fileInput.value?.click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const MAX_SIZE = 10 * 1024 * 1024;

    if (file) {
        if (file.size > MAX_SIZE) {
            toast.add({
                severity: 'warn',
                summary: 'Внимание',
                detail: 'Файл слишком большой. Максимальный размер: 10 МБ.',
                life: 3000
            });
            fileInput.value.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (currentQuestion.value) {
                const question = questions.value[currentQuestionIndex.value];
                question.mediaUrl = reader.result;
                question.mediaName = file.name;
                question.mediaSize = (file.size / 1024).toFixed(2);
                question.mediaType = file.type.split('/')[0];
                question.mediaFile = file;
            }
            fileInput.value.value = '';
        };
        reader.readAsDataURL(file);
    }
}

function removeMedia() {
    if (currentQuestion.value) {
        const question = questions.value[currentQuestionIndex.value];
        question.mediaUrl = null;
        question.mediaType = null;
        question.mediaName = null;
        question.mediaSize = null;
    }
    fileInput.value.value = '';
}

function updateQuestionText() {
    if (currentQuestionIndex.value !== null) {
        questions.value[currentQuestionIndex.value].text = currentQuestionText.value;
    }
}

async function handleSaveSurvey(data) {
    if (!surveyTitle.value.trim()) {
        surveyTitle.value = data.title;
    }
    await submitSurvey();
}

async function submitSurvey() {
    if (!surveyTitle.value.trim()) {
        responseMessage.value = 'Название опроса не может быть пустым.';
        responseClass.value = 'error';
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        responseMessage.value = 'Ошибка авторизации. Пожалуйста, войдите заново.';
        responseClass.value = 'error';
        return;
    }

    const imageUploadPromises = questions.value.map(async (question) => {
        if (question.mediaFile && (!question.file_url || question.mediaFile.name !== question.file_name)) {
            const formData = new FormData();
            formData.append('file', question.mediaFile);
            formData.append('mediaType', question.mediaType);

            try {
                const res = await axios.post(`${apiUrl}/api/upload-image`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });

                question.file_folder = res.data.folder;
                question.file_name = res.data.fileName;
                question.file_type = res.data.fileType;
                question.file_url = res.data.url;
            } catch (error) {
                console.error('Ошибка загрузки файла:', error);
                throw error;
            }
        }
    });

    try {
        await Promise.all(imageUploadPromises);

        const surveyData = {
            user_id: userId.value,
            title: surveyTitle.value.trim(),
            questions: questions.value.map((q, index) => ({
                id: q.id,
                text: q.text.trim() || `Вопрос ${index + 1}`,
                correct_option: q.selectedOption,
                options: q.options.map((opt) => opt.trim()).filter((opt) => opt !== ''),
                file_folder: q.file_folder || null,
                file_name: q.file_name || null,
                file_type: q.file_type || null,
                file_url: q.file_url || null
            }))
        };

        const invalidQuestions = surveyData.questions.filter((q) => !q.text || q.correct_option === null || q.options.some((opt) => !opt));
        if (invalidQuestions.length > 0) {
            responseMessage.value = 'Заполните все вопросы и правильные варианты.';
            responseClass.value = 'error';
            return;
        }

        const surveyId = route.query.id;
        const method = surveyId ? 'put' : 'post';
        const url = surveyId ? `${apiUrl}/api/surveys/${surveyId}` : `${apiUrl}/api/surveys`;

        const response = await axios[method](url, surveyData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        responseMessage.value = surveyId ? 'Опрос обновлён.' : 'Опрос сохранён.';
        responseClass.value = 'success';
        router.push({ name: 'dashboard' });
    } catch (error) {
        console.error('Ошибка сохранения опроса:', error);
        responseMessage.value = 'Ошибка при сохранении.';
        responseClass.value = 'error';
    }
}

async function loadSurvey(surveyId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            responseMessage.value = 'Ошибка авторизации. Пожалуйста, войдите заново.';
            responseClass.value = 'error';
            return;
        }

        const response = await axios.get(`${apiUrl}/api/surveys/${surveyId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const survey = response.data;
        surveyTitle.value = survey.title || 'Без названия';

        questions.value = survey.questions.map((q) => ({
            id: q.id,
            text: q.text || 'Без текста',
            options: q.options?.map((opt) => opt.text || '') ?? ['', '', '', ''],
            selectedOption: q.correct_option_id ?? null,
            mediaUrl: q.file_url || '',
            mediaType: q.file_type || ''
        }));

        if (questions.value.length === 0) {
            addQuestion();
        }

        selectQuestion(0);
        responseMessage.value = 'Опрос успешно загружен.';
        responseClass.value = 'success';
    } catch (error) {
        console.error('Ошибка загрузки опроса:', error);
        responseMessage.value = 'Ошибка загрузки.';
        responseClass.value = 'error';
    }
}

// MOUNTED
onMounted(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        router.push({ name: 'login' });
        return;
    }

    try {
        const decoded = jwtDecode(token);
        if (decoded?.id) {
            userId.value = decoded.id;
        } else {
            throw new Error('ID пользователя отсутствует');
        }

        const surveyId = route.query.id;
        if (surveyId) {
            loadSurvey(surveyId);
        } else {
            router.push('/pages/dashboard');
        }
    } catch (err) {
        console.error('Ошибка токена:', err);
        router.push({ name: 'login' });
    }

    if (questions.value.length === 0) {
        addQuestion();
    }
});
</script>

<template>
    <SurveyLayout v-model:surveyTitle="surveyTitle" :questions="questions" @selectQuestion="selectQuestion" @saveSurvey="handleSaveSurvey" @addQuestion="addQuestion" @copyQuestion="copyQuestion" @deleteQuestion="deleteQuestion" @goBack="goBack">
        <div v-if="currentQuestion" class="card" style="min-height: 80vh">
            <!-- Текст вопроса -->
            <!-- <input v-model="currentQuestionText" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" /> -->
            <div class="flex items-center">
                <span class="question-number">{{ currentQuestionIndex !== null ? currentQuestionIndex + 1 : '' }}</span>
                <!-- <input v-model="currentQuestionText" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" /> -->
                <input v-maxlength="200" v-model="questions[currentQuestionIndex].text" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" />
            </div>
            <!-- Событие для обновления текста вопроса -->

            <!-- Медиа  -->
            <div class="image-container" v-if="!currentQuestion.mediaUrl">
                <Button @click="triggerFileInput" icon="pi pi-upload" severity="info" class="btn-add-image" outlined />
                <input ref="fileInput" type="file" @change="handleFileUpload" accept="image/*,video/*,audio/*" style="display: none" />
            </div>

            <!-- Предпросмотр фото -->
            <div v-if="currentQuestion.mediaUrl" class="image-container">
                <div class="image-preview">
                    <Button class="delete-btn" @click="removeMedia" icon="pi pi-times" severity="danger" rounded />

                    <template v-if="currentQuestion.mediaType === 'image'">
                        <img :src="currentQuestion.mediaUrl" alt="Загруженное изображение" class="uploaded-image" />
                    </template>

                    <template v-else-if="currentQuestion.mediaType === 'video'">
                        <video :src="currentQuestion.mediaUrl" controls class="uploaded-image"></video>
                    </template>

                    <template v-else-if="currentQuestion.mediaType === 'audio'">
                        <audio :src="currentQuestion.mediaUrl" controls class="uploaded-image"></audio>
                    </template>
                </div>
            </div>

            <!-- Список вариантов ответа -->
            <ul>
                <li v-for="(option, index) in currentQuestion.options" :key="index" :class="{ selected: currentQuestion.selectedOption === index }" @click="selectOption(index)" class="option">
                    <span class="option-label">{{ ['А', 'Б', 'В', 'Г'][index] }}.</span>
                    <input v-maxlength="200" v-model="currentQuestion.options[index]" placeholder="Введите текст ответа" class="option-input" />
                </li>
            </ul>
        </div>
    </SurveyLayout>
</template>

<style scoped>
.question-display {
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
}

.option {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    margin: 10px;
}

.option-label {
    margin-right: 10px;
    font-weight: bold;
}

.option-input {
    border: none;
    outline: none;
    background-color: #f9f9f9;
    width: 100%;
    padding: 5px;
}

.option.selected {
    border: 1px solid var(--p-primary-color); /* Зеленая рамка для правильного варианта */
    border-radius: 8px;
}

.question-input {
    width: 100%;
    padding: 8px;
    font-size: 18px;
    margin-bottom: 15px;
    background-color: #f9f9f9;
}

.question-number {
    padding: 8px 16px;
    font-size: 20px;
    margin-bottom: 15px;
    margin-right: 15px;
    font-weight: bold;
    color: white; /* Используйте переменные темы, если нужно */
    background-color: #0ea5e9;
    border-radius: 3px;
}
.question-input:focus {
    border-color: none !important; /* Цвет рамки при фокусе */
    outline: none !important;
}
.image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 30vh;
}

/* Стили для кнопки загрузки */
/* .btn-add-image {
    width: 100%;
    height: 30vh;
    border: dashed 2px #0ea5e9;
    border-radius: 4px;
    cursor: pointer;
}

.btn-add-image :deep(.pi) {
    font-size: 2.5rem;
} */

/* Контейнер изображения */
.image-preview {
    position: relative;
    width: 60%;
    max-width: 600px;
    /* height: 40vh;
    overflow: hidden; */
    display: flex;
    justify-content: center;
    align-items: center;
}

.image-preview img,
.image-preview video {
    width: 100%;
    height: 40vh;
    object-fit: contain; /* Сохранение пропорций, вписывание в контейнер */
    border-radius: 4px;
    border: 0.5px solid #e9e9e9;
}
/* Для аудио */
.image-preview audio {
    width: 100%;
    height: 10vh;
    border: none;
}

.btn-add-image {
    width: 100%;
    height: 30vh;
    border: dashed 2px #0ea5e9;
    border-radius: 4px;
    cursor: pointer;
}

.btn-add-image :deep(.pi) {
    font-size: 2.5rem;
}
.delete-btn {
    position: absolute;
    top: -5px;
    right: -20px;
}
</style>
