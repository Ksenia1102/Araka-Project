<script>
import SurveyLayout from '@/layout/SurveyLayout.vue';
import axios from 'axios'; // Используем axios для отправки запросов на сервер

export default {
    components: {
        SurveyLayout
    },
    data() {
        return {
            surveyTitle: '',
            questions: [], // Начинаем с пустого массива вопросов
            currentQuestionIndex: null, // Индекс текущего вопроса
            responseMessage: '', // Сообщение об ответе от сервера
            responseClass: '', // Класс для отображения успеха или ошибки
            userId: 1 // Инициализируйте userId!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        };
    },
    computed: {
        currentQuestion() {
            return this.currentQuestionIndex !== null ? this.questions[this.currentQuestionIndex] : null;
        }
    },
    methods: {
        goBack() {
            this.$router.push('/pages/dashboard');
        },
        selectQuestion(index) {
            this.currentQuestionIndex = index;
        },
        addQuestion() {
            const newQuestion = {
                text: `Вопрос ${this.questions.length + 1}`, // Динамическое название вопроса
                options: ['', '', '', ''], // Четыре пустых варианта по умолчанию
                selectedOption: null // Изначально правильный вариант не выбран
            };
            this.questions.push(newQuestion);
            this.selectQuestion(this.questions.length - 1); // Переходим к новому вопросу
        },
        copyQuestion(index) {
            const questionToCopy = this.questions[index];
            const copiedQuestion = {
                ...JSON.parse(JSON.stringify(questionToCopy)), // Глубокая копия вопроса
                text: `${questionToCopy.text} (Копия)`
            };
            this.questions.push(copiedQuestion);
            this.selectQuestion(this.questions.length - 1); // Переходим к скопированному вопросу
        },
        deleteQuestion(index) {
            this.questions.splice(index, 1);
            if (this.questions.length === 0) {
                this.currentQuestionIndex = null; // Убираем выделение, если вопросов нет
                this.addQuestion(); // Добавляем новый вопрос, если все вопросы удалены
            } else {
                this.currentQuestionIndex = Math.min(index, this.questions.length - 1); // Переходим к следующему доступному вопросу
            }
        },
        selectOption(index) {
            if (this.currentQuestion) {
                this.currentQuestion.selectedOption = index; // Устанавливаем выбранный вариант как правильный
            }
        },

        // Новый метод для отправки опроса на сервер
        submitSurvey() {
            if (!this.surveyTitle.trim()) {
                this.responseMessage = 'Название опроса не может быть пустым.';
                this.responseClass = 'error';
                return;
            }

            const surveyData = {
                user_id: this.userId,
                title: this.surveyTitle.trim(), // Удаляем лишние пробелы
                questions: this.questions.map((q, index) => ({
                    text: q.text.trim() || `Вопрос ${index + 1}`, // Используем номер вопроса, если текст пустой
                    correct_option: q.selectedOption,
                    options: q.options.map((opt) => opt.trim()) // Убираем пробелы вокруг вариантов ответа
                }))
            };

            const invalidQuestions = surveyData.questions.filter((q) => !q.text || q.correct_option === null || q.options.some((opt) => !opt));

            if (invalidQuestions.length > 0) {
                this.responseMessage = 'Убедитесь, что все вопросы заполнены и у каждого есть правильный вариант.';
                this.responseClass = 'error';
                return;
            }

            axios
                .post('http://localhost:3000/api/surveys/create', surveyData)
                .then((response) => {
                    this.responseMessage = 'Опрос успешно сохранен';
                    this.responseClass = 'success';
                    console.log(response.data);
                })
                .catch((error) => {
                    this.responseMessage = 'Произошла ошибка при создании опроса';
                    this.responseClass = 'error';
                    console.error(error);
                });
        }
    },
    mounted() {
        if (this.questions.length === 0) {
            this.addQuestion(); // Добавляем первый вопрос при загрузке, если вопросов нет
        }
    }
};
</script>

<template>
    <SurveyLayout :title="surveyTitle" :questions="questions" @goBack="goBack" @selectQuestion="selectQuestion" @addQuestion="addQuestion" @copyQuestion="copyQuestion" @deleteQuestion="deleteQuestion">
        <div v-if="currentQuestion !== null" class="card">
            <input v-model="surveyTitle" placeholder="Введите название опроса" />
            <ul>
                <li v-for="(option, index) in currentQuestion.options" :key="index" :class="{ selected: currentQuestion.selectedOption === index }" @click="selectOption(index)" class="option">
                    <span class="option-label">{{ ['А', 'Б', 'В', 'Г'][index] }}.</span>
                    <input v-model="currentQuestion.options[index]" placeholder="Введите текст ответа" class="option-input" />
                </li>
            </ul>
        </div>
        <!-- Кнопка для отправки данных на сервер -->
        <div class="actions">
            <button @click="submitSurvey" class="submit-button">Создать опрос</button>
        </div>

        <!-- Сообщение о результате отправки -->
        <div v-if="responseMessage" :class="responseClass" class="message">
            {{ responseMessage }}
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
    border: 1px solid green; /* Зеленая рамка для правильного варианта */
}

.question-input {
    width: 100%;
    padding: 8px;
    font-size: 18px;
    margin-bottom: 15px;
}
</style>
