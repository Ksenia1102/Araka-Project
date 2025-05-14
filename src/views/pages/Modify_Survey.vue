<script>
import SurveyLayout from '@/layout/SurveyLayout.vue';
import axios from 'axios'; // Используем axios для запросов на сервер
import jwtDecode from 'jwt-decode';
import { useToast } from 'primevue/usetoast';
const apiUrl = import.meta.env.VITE_API_URL;
const toast = useToast();
//import Toastify from 'toastify-js'; // Библиотека для уведомлений
export default {
    components: {
        SurveyLayout
    },
    data() {
        return {
            surveyTitle: '',
            questions: [], // Начинаем с пустого массива вопросов
            currentQuestionIndex: null, // Индекс текущего вопроса
            currentQuestionText: '', // Локальная переменная для текста вопроса
            responseMessage: '', // Сообщение от сервера
            responseClass: '', // Класс для отображения успеха или ошибки
            userId: null // ID пользователя (инициализируйте здесь или получайте из других данных)
        };
    },
    // created() {
    //     // Получаем ID пользователя из localStorage (или из других мест)
    //     const userId = localStorage.getItem('userId');
    //     if (userId) {
    //         this.userId = userId; // Присваиваем ID пользователя
    //     } else {
    //         console.error('User is not authenticated');
    //         // Вы можете перенаправить на страницу входа, если пользователь не авторизован
    //         this.$router.push({ name: 'login' });
    //     }
    // },
    computed: {
        currentQuestion() {
            if (this.currentQuestionIndex !== null) {
                const question = this.questions[this.currentQuestionIndex];
                return {
                    ...question,
                    indexedText: `${this.currentQuestionIndex + 1}. ${question.text}` // Нумерация добавляется в шаблоне
                };
            }
            return null;
        }
    },
    methods: {
        goBackAndReload() {
            window.history.back(); // Вернуться на предыдущую страницу
            // Для перезагрузки страницы, на которой вы оказались, можно использовать:
            window.location.reload(); // Но это нужно делать на самой предыдущей странице
        },
        goBack() {
            this.$router.push('/pages/dashboard'); // Возврат на страницу dashboard
        },
        selectQuestion(index) {
            this.currentQuestionIndex = index;
            this.currentQuestionText = this.questions[index].text; // Устанавливаем текст текущего вопроса
        },
        addQuestion() {
            const newQuestion = {
                text: `Вопрос ${this.questions.length + 1}`, // Название вопроса по умолчанию
                options: ['', '', '', ''], // Четыре пустых варианта
                selectedOption: null // Не выбран правильный вариант
            };
            this.questions.push(newQuestion);
            this.selectQuestion(this.questions.length - 1); // Переход к новому вопросу
            this.currentQuestionText = newQuestion.text; // Устанавливаем текст для текущего вопроса
        },
        copyQuestion(index) {
            const questionToCopy = this.questions[index];
            const copiedQuestion = {
                ...JSON.parse(JSON.stringify(questionToCopy)), // Глубокая копия
                text: `${questionToCopy.text} (Копия)`
            };
            this.questions.push(copiedQuestion);
            this.selectQuestion(this.questions.length - 1); // Переход к скопированному вопросу
        },
        deleteQuestion(index) {
            this.questions.splice(index, 1);
            if (this.questions.length === 0) {
                this.currentQuestionIndex = null;
                this.addQuestion(); // Добавляем новый вопрос, если список пуст
            } else {
                this.currentQuestionIndex = Math.min(index, this.questions.length - 1); // Сохраняем доступный индекс
            }
        },
        selectOption(index) {
            if (this.currentQuestion) {
                this.questions[this.currentQuestionIndex].selectedOption = index; // Устанавливаем правильный вариант
            }
        },
        triggerFileInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        handleFileUpload(event) {
            const file = event.target.files[0];
            const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

            if (file) {
                if (file.size > MAX_SIZE) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Внимание',
                        detail: 'Файл слишком большой. Максимальный размер: 10 МБ.',
                        life: 3000
                    });
                    this.$refs.fileInput.value = ''; // Очистить input
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    if (this.currentQuestion) {
                        this.questions[this.currentQuestionIndex].mediaUrl = reader.result;
                        this.questions[this.currentQuestionIndex].mediaName = file.name;
                        this.questions[this.currentQuestionIndex].mediaSize = (file.size / 1024).toFixed(2);
                        const fileType = file.type.split('/')[0]; // тип файла
                        this.questions[this.currentQuestionIndex].mediaType = fileType;

                        // ВАЖНО: Сохраняем сам файл, чтобы потом его отправить на сервер
                        this.questions[this.currentQuestionIndex].mediaFile = file;
                    }
                    this.$refs.fileInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        },
        removeMedia() {
            if (this.currentQuestion) {
                this.questions[this.currentQuestionIndex].mediaUrl = null;
                this.questions[this.currentQuestionIndex].mediaType = null;
                this.questions[this.currentQuestionIndex].mediaName = null;
                this.questions[this.currentQuestionIndex].mediaSize = null;
            }
            this.$refs.fileInput.value = '';
        },
        handleSaveSurvey(data) {
            if (!this.surveyTitle.trim()) {
                this.surveyTitle = data.title;
            } // Только обновляем заголовок
            this.submitSurvey(); // Отправляем опрос
        },
        updateQuestionText() {
            if (this.currentQuestionIndex !== null) {
                this.questions[this.currentQuestionIndex].text = this.currentQuestionText;
            }
        },
        // Отправка данных на сервер
        async submitSurvey() {
            if (!this.surveyTitle.trim()) {
                this.responseMessage = 'Название опроса не может быть пустым.';
                this.responseClass = 'error';
                return;
            }

            const token = localStorage.getItem('authToken');
            if (!token) {
                this.responseMessage = 'Ошибка авторизации. Пожалуйста, войдите заново.';
                this.responseClass = 'error';
                return;
            }

            // Загружаем только новые файлы
            const imageUploadPromises = this.questions.map(async (question) => {
                // Если есть новый файл для загрузки (mediaFile) и нет file_url (значит это новый файл)
                // ИЛИ если есть mediaFile и он отличается от текущего file_name (пользователь заменил файл)
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

                        // Обновляем данные о файле в вопросе
                        question.file_folder = res.data.folder;
                        question.file_name = res.data.fileName;
                        question.file_type = res.data.fileType;
                        question.file_url = res.data.url;
                        console.log('Новый файл загружен:', res.data);
                    } catch (error) {
                        console.error('Ошибка загрузки файла:', error);
                        throw error;
                    }
                } else if (question.file_url && !question.mediaFile) {
                    // Файл уже был загружен ранее и не был изменен - оставляем как есть
                    console.log('Файл уже загружен ранее, оставляем без изменений');
                }
            });

            try {
                // Дожидаемся загрузки всех новых файлов
                await Promise.all(imageUploadPromises);

                // Подготавливаем данные для отправки
                const surveyData = {
                    user_id: this.userId,
                    title: this.surveyTitle.trim(),
                    questions: this.questions.map((q, index) => ({
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

                // Проверка валидности данных
                const invalidQuestions = surveyData.questions.filter((q) => !q.text || q.correct_option === null || q.options.some((opt) => !opt));

                if (invalidQuestions.length > 0) {
                    this.responseMessage = 'Убедитесь, что все вопросы заполнены и у каждого есть правильный вариант.';
                    this.responseClass = 'error';
                    return;
                }

                const surveyId = this.$route.query.id;
                const method = surveyId ? 'put' : 'post';
                const url = surveyId ? `${apiUrl}/api/surveys/${surveyId}` : `${apiUrl}/api/surveys`;

                // Отправка данных опроса
                const response = await axios[method](url, surveyData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log('Ответ сервера:', response.data);
                this.responseMessage = surveyId ? 'Опрос успешно обновлён.' : 'Опрос успешно сохранён.';
                this.responseClass = 'success';
                this.$router.push({ name: 'dashboard' });
            } catch (error) {
                console.error('Ошибка при сохранении опроса:', error.response?.data || error.message);
                this.responseMessage = 'Произошла ошибка при сохранении опроса.';
                this.responseClass = 'error';
            }
        },
        async loadSurvey(surveyId) {
            try {
                const token = localStorage.getItem('authToken'); // Получаем токен из локального хранилища
                if (!token) {
                    console.error('Токен отсутствует. Необходимо авторизоваться.');
                    this.responseMessage = 'Ошибка авторизации. Пожалуйста, войдите заново.';
                    this.responseClass = 'error';
                    return;
                }

                // Запрос данных с сервера
                const response = await axios.get(`${apiUrl}/api/surveys/${surveyId}`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Стандартный формат
                    } // Передаём токен в заголовках
                });

                // Обработка успешного ответа
                const survey = response.data;

                // Устанавливаем заголовок опроса
                this.surveyTitle = survey.title || 'Без названия';

                this.questions = survey.questions.map((question) => {
                    // Проверяем и форматируем варианты ответов
                    const options = question.options && question.options.length > 0 ? question.options.map((opt) => opt.text || '') : ['', '', '', ''];
                    console.log('232323', question);
                    return {
                        id: question.id, // Сохраняем ID вопроса
                        text: question.text || 'Без текста',
                        options: options,
                        selectedOption: question.correct_option_id !== undefined ? question.correct_option_id : null,
                        mediaUrl: question.file_url || '', // URL медиа (если есть)
                        mediaType: question.file_type || '' // Тип медиа (например, image, video, audio)
                    };
                });

                console.log('23232343433', this.questions);

                // Если вопросов нет, создаём один новый
                if (this.questions.length === 0) {
                    this.addQuestion();
                }

                // Устанавливаем текущий вопрос
                this.selectQuestion(0);

                this.responseMessage = 'Данные опроса успешно загружены.';
                this.responseClass = 'success';
            } catch (error) {
                // Обработка ошибок
                console.error('Ошибка загрузки данных опроса:', error.response?.data || error.message);
                this.responseMessage = 'Ошибка загрузки данных опроса. Попробуйте позже.';
                this.responseClass = 'error';
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('authToken'); // Извлекаем токен из localStorage
        if (!token) {
            console.error('Пользователь не авторизован');
            this.$router.push({ name: 'login' }); // Перенаправление на страницу входа
            return;
        }

        try {
            // Используем jwt-decode для извлечения данных из токена
            const decoded = jwtDecode(token);
            if (decoded && decoded.id) {
                this.userId = decoded.id; // Устанавливаем userId из токена
            } else {
                throw new Error('ID пользователя отсутствует в токене');
            }

            const surveyId = this.$route.query.id; // Получаем ID опроса из маршрута
            if (surveyId) {
                this.loadSurvey(surveyId); // Загружаем данные
            } else {
                console.error('ID опроса отсутствует. Перенаправление на главную страницу.');
                this.$router.push('/pages/dashboard'); // Перенаправление на дашборд
            }
        } catch (err) {
            console.error('Ошибка декодирования токена:', err);
            this.$router.push({ name: 'login' }); // Перенаправление на страницу входа
        }

        if (this.questions.length === 0) {
            this.addQuestion();
        }
    }
};
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
