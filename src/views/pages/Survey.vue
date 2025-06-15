<script setup>
import SurveyLayout from '@/layout/SurveyLayout.vue';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useToast } from 'primevue/usetoast';
import { computed, inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const apiUrl = import.meta.env.VITE_API_URL;
const toast = useToast();
const router = useRouter();
const loading = inject('loading');

const surveyTitle = ref('');
const questions = ref([]);
const currentQuestionIndex = ref(null);
const currentQuestionText = ref('');
const responseMessage = ref('');
const responseClass = ref('');
const userId = ref(null);

const currentQuestion = computed(() => {
    const idx = currentQuestionIndex.value;
    if (idx !== null && questions.value[idx]) {
        const question = questions.value[idx];
        return {
            ...question,
            indexedText: `${idx + 1}. ${question.text || ''}`
        };
    }
    return null;
});

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
        selectedOption: null,
        mediaUrl: null,
        mediaType: null,
        mediaName: '',
        mediaSize: 0
    };
    questions.value.push(newQuestion);
    selectQuestion(questions.value.length - 1);
}

function copyQuestion(index) {
    const questionToCopy = questions.value[index];
    const baseText = questionToCopy.text.replace(/\s*\(Копия\s*\d*\)$/, '');

    let copyNumber = 1;
    questions.value.forEach((q) => {
        const match = q.text.match(new RegExp(`^${baseText} \\(Копия (\\d+)\\)$`));
        if (match) {
            copyNumber = Math.max(copyNumber, parseInt(match[1]) + 1);
        }
    });

    const copied = {
        ...questionToCopy,
        text: `${baseText} (Копия ${copyNumber})`,
        options: [...questionToCopy.options]
    };
    questions.value.push(copied);
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

function triggerFileInput() {
    fileInput.value?.click();
}

const fileInput = ref(null);

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
            const question = questions.value[currentQuestionIndex.value];
            if (question) {
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
    const question = questions.value[currentQuestionIndex.value];
    if (question) {
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

function handleSaveSurvey(data) {
    surveyTitle.value = data.title;
    submitSurvey();
}

async function submitSurvey() {
    if (!surveyTitle.value.trim()) {
        responseMessage.value = 'Название теста не может быть пустым.';
        responseClass.value = 'error';
        return;
    }

    updateQuestionText();

    const token = localStorage.getItem('authToken');

    try {
        const imageUploadPromises = questions.value.map(async (q) => {
            if (q.mediaUrl && q.mediaFile) {
                const formData = new FormData();
                formData.append('file', q.mediaFile);
                formData.append('mediaType', q.mediaType);
                loading.show('Отправка данных...'); // Показываем индикатор
                const res = await axios.post(`${apiUrl}/api/upload-image`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });

                q.file_folder = res.data.folder;
                q.file_name = res.data.fileName;
                q.file_type = res.data.fileType;
                q.file_url = res.data.url;
            }
        });

        await Promise.all(imageUploadPromises);

        const surveyData = {
            user_id: userId.value,
            title: surveyTitle.value.trim(),
            questions: questions.value.map((q, index) => ({
                text: q.text.trim() || `Вопрос ${index + 1}`,
                correct_option: q.selectedOption,
                options: q.options.map((opt) => opt.trim()),
                file_folder: q.file_folder || null,
                file_name: q.file_name || null,
                file_type: q.file_type || null,
                file_url: q.file_url || null
            }))
        };

        const invalid = surveyData.questions.some((q) => !q.text || q.correct_option === null || q.options.some((opt) => !opt));

        if (invalid) {
            responseMessage.value = 'Заполните все поля и выберите правильные ответы.';
            responseClass.value = 'error';
            return;
        }

        await axios.post(`${apiUrl}/api/surveys`, surveyData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        responseMessage.value = 'Тест успешно сохранён.';
        responseClass.value = 'success';
        router.push({ name: 'dashboard' });
    } catch (error) {
        console.error('Ошибка при сохранении теста:', error.response?.data || error.message);
        responseMessage.value = 'Ошибка при сохранении теста.';
        responseClass.value = 'error';
    } finally {
        loading.hide(); // Скрываем индикатор
    }
}

onMounted(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Пользователь не авторизован');
        router.push({ name: 'login' });
        return;
    }

    try {
        const decoded = jwtDecode(token);
        if (decoded?.id) {
            userId.value = decoded.id;
        } else {
            throw new Error('ID пользователя отсутствует в токене');
        }
    } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        router.push({ name: 'login' });
    }

    if (questions.value.length === 0) {
        addQuestion();
    }
});
</script>

<template>
    <SurveyLayout v-model:surveyTitle="surveyTitle" :questions="questions" @selectQuestion="selectQuestion" @saveSurvey="handleSaveSurvey" @addQuestion="addQuestion" @copyQuestion="copyQuestion" @deleteQuestion="deleteQuestion" @goBack="goBack">
        <!-- max-width: 120vh -->
        <div v-if="currentQuestion" class="card" style="min-height: 80vh">
            <!-- Текст вопроса -->
            <!-- <input v-model="currentQuestionText" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" /> -->
            <div class="flex items-center">
                <span class="question-number">{{ currentQuestionIndex + 1 }}</span>
                <!-- <input v-maxlength="300" v-model="currentQuestionText" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" /> -->
                <input v-maxlength="200" v-model="questions[currentQuestionIndex].text" placeholder="Введите текст вопроса" class="question-input" />
            </div>
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

            <!-- Варианты ответов -->
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
