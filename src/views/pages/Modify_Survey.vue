<script>
import SurveyLayout from '@/layout/SurveyLayout.vue';
import axios from 'axios'; // Используем axios для запросов на сервер
import jwtDecode from 'jwt-decode';
const apiUrl = import.meta.env.VITE_API_URL;
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
        submitSurvey() {
            if (!this.surveyTitle.trim()) {
                this.responseMessage = 'Название опроса не может быть пустым.';
                this.responseClass = 'error';
                return;
            }

            this.questions[this.currentQuestionIndex].text = this.currentQuestionText;
            const surveyData = {
                user_id: this.userId,
                title: this.surveyTitle.trim(),
                questions: this.questions.map((q, index) => ({
                    text: q.text.trim() || `Вопрос ${index + 1}`,
                    correct_option: q.selectedOption,
                    options: q.options.map((opt) => opt.trim())
                }))
            };

            const invalidQuestions = surveyData.questions.filter((q) => !q.text || q.correct_option === null || q.options.some((opt) => !opt));
            if (invalidQuestions.length > 0) {
                this.responseMessage = 'Убедитесь, что все вопросы заполнены и у каждого есть правильный вариант.';
                this.responseClass = 'error';
                return;
            }

            const token = localStorage.getItem('authToken');
            const surveyId = this.$route.query.id; // Получаем ID опроса из маршрута (если есть)

            // Если surveyId существует, то редактируем опрос
            const url = surveyId
                ? `${apiUrl}/api/surveys/update/${surveyId}` // Используем PUT запрос
                : `${apiUrl}/api/surveys/create`; // Если ID нет, то создаем новый опрос

            // Отправляем запрос с токеном в заголовке
            axios
                .post(url, surveyData, {
                    headers: {
                        token: token // Добавляем токен в заголовки
                    }
                })
                .then((response) => {
                    console.log('Ответ сервера:', response.data);
                    this.responseMessage = surveyId ? 'Опрос успешно обновлён.' : 'Опрос успешно сохранён.';
                    this.responseClass = 'success';
                    this.$router.push({ name: 'dashboard' });
                })
                .catch((error) => {
                    console.error('Ошибка при сохранении опроса:', error.response?.data || error.message);
                    this.responseMessage = 'Произошла ошибка при сохранении опроса.';
                    this.responseClass = 'error';
                });
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
                    headers: { token } // Передаём токен в заголовках
                });

                // Обработка успешного ответа
                const survey = response.data;

                // Устанавливаем заголовок опроса
                this.surveyTitle = survey.title || 'Без названия';

                // Устанавливаем вопросы опроса
                this.questions = survey.questions.map((q, index) => ({
                    text: q.text || `Вопрос ${index + 1}`,
                    options: q.options.length > 0 ? q.options : ['', '', '', ''], // Обеспечиваем 4 варианта
                    selectedOption: q.correct_option !== undefined ? q.correct_option : null
                }));

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
        <div v-if="currentQuestion !== null" class="card" style="height: 80vh; max-width: 120vh">
            <!-- Текст вопроса -->
            <!-- <input v-model="currentQuestionText" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" /> -->
            <div class="flex items-center">
                <span class="question-number">{{ currentQuestionIndex !== null ? currentQuestionIndex + 1 : '' }}</span>
                <input v-model="currentQuestionText" placeholder="Введите текст вопроса" class="question-input" @input="updateQuestionText" />
            </div>
            <!-- Событие для обновления текста вопроса -->

            <!-- Список вариантов ответа -->
            <ul>
                <li v-for="(option, index) in currentQuestion.options" :key="index" :class="{ selected: currentQuestion.selectedOption === index }" @click="selectOption(index)" class="option">
                    <span class="option-label">{{ ['А', 'Б', 'В', 'Г'][index] }}.</span>
                    <input v-model="currentQuestion.options[index]" placeholder="Введите текст ответа" class="option-input" />
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
    border: 1px solid #0ea5e9; /* Зеленая рамка для правильного варианта */
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
</style>
