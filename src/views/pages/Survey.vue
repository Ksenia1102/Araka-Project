<script>
import SurveyLayout from '@/layout/SurveyLayout.vue';

export default {
    components: {
        SurveyLayout
    },
    data() {
        return {
            surveyTitle: '',
            questions: [], // Начинаем с пустого массива вопросов
            currentQuestionIndex: null // Индекс текущего вопроса
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
                text: 'Новый вопрос',
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
            <input v-model="currentQuestion.text" placeholder="Введите текст вопроса" class="question-input" />
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
