<script setup>
import { computed, onMounted, ref } from 'vue';

// Фейковые данные для опроса
const quizData = ref({
    questions: [
        {
            text: 'Какое животное символизирует мудрость?',
            options: ['Со fbg fg g gf gf gf g  gfggbfggfbgfbgff f fgfgfg g fgfgfgb g fg gfgfgfgfggf fgfgbfgf  fва', 'Кошка', 'Лиса', 'Волк']
        },
        {
            text: 'Какая планета самая большая в Солнечной системе?',
            options: ['Земля', 'Юпитер', 'Сатурн', 'Марс']
        },
        {
            text: 'Как называется столица Франции?',
            options: ['Лондон', 'Берлин', 'Париж', 'Рим']
        },
        {
            text: 'Кто написал "Война и мир"?',
            options: ['Толстой', 'Достоевский', 'Чехов', 'Пушкин']
        }
    ]
});

// Данные для учеников
const studentModel = computed(() => {
    return [
        {
            label: 'Участники',
            items: [
                { label: 'Алексей Прохоров', cardNumber: 1 },
                { label: 'Анна Ахматова', cardNumber: 2 },
                { label: 'Владимир Маяковский', cardNumber: 3 },
                { label: 'Марина Цветаева', cardNumber: 4 },
                { label: 'Сергей Есенин', cardNumber: 5 }
            ]
        }
    ];
});

// Состояние
const currentQuestionIndex = ref(0);
const currentQuestion = ref(quizData.value.questions[0]);
const answersReceived = ref(0); // Количество ответов
const correctAnswers = ref(0); // Количество правильных ответов
const quizFinished = ref(false); // Флаг завершения опроса

const nextQuestion = () => {
    if (currentQuestionIndex.value < quizData.value.questions.length - 1) {
        currentQuestionIndex.value++;
        currentQuestion.value = quizData.value.questions[currentQuestionIndex.value];
        resetStats();
        simulateAnswers();
    } else {
        // Завершаем опрос
        quizFinished.value = true;
        resetStats();
    }
};

const finishQuiz = () => {
    quizFinished.value = true;
};

const prevQuestion = () => {
    if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--;
        currentQuestion.value = quizData.value.questions[currentQuestionIndex.value];
        resetStats();
        simulateAnswers();
    }
};

// Сброс статистики
const resetStats = () => {
    answersReceived.value = 0;
    correctAnswers.value = 0;
};

// Эмуляция ответов
let simulationInterval = null;

const simulateAnswers = () => {
    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
        const totalStudents = studentModel.value[0].items.length;

        if (answersReceived.value < totalStudents) {
            answersReceived.value++; // Увеличиваем количество ответов
        }
        if (correctAnswers.value < answersReceived.value) {
            correctAnswers.value++; // Увеличиваем количество правильных ответов
        }
    }, 1000); // Обновляем каждую секунду
};

// onMounted(() => {
//     if (simulationInterval) clearInterval(simulationInterval);
// });
onMounted(() => {
    simulateAnswers();
});
</script>

<template>
    <div class="quiz-layout">
        <!-- Верхнее меню -->
        <div class="topbar">
            <Button @click="$emit('goBack')" icon="pi pi-chevron-left" class="back-btn" text severity="secondary"></Button>
            <div class="survey-title">
                <h1 class="survey-title-input">Опрос 1 ghghgh</h1>
            </div>
            <div class="flex items-center">
                <!-- <span class="question-number" style="margin-right: 0.2em">ЗАПУЩЕН</span> -->
                <!-- <h2>ДЛЯ КЛАССА ID: {{ quizData.classId }}</h2> -->
            </div>
        </div>

        <!-- Основное содержимое -->
        <div class="content">
            <!-- Боковое меню -->
            <div class="sidebar">
                <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0">
                    <template v-for="(item, i) in studentModel" :key="i">
                        <li v-if="item.label" class="layout-menu-category font-semibold text-xl mb-4">{{ item.label }}</li>
                        <template v-for="(student, j) in item.items" :key="j">
                            <li class="layout-menuitem">
                                <div class="layout-menuitem-link">
                                    <span class="layout-menuitem-text">{{ student.label }}</span>
                                </div>
                                <div class="layout-menuitem-actions">
                                    <span class="question-number">{{ student.cardNumber }}</span>
                                </div>
                            </li>
                        </template>
                    </template>
                </ul>
            </div>

            <!-- Основной контент -->
            <div class="main-content">
                <!-- width: 120vh; -->
                <div v-if="quizFinished" class="flex flex-col md:flex-row">
                    <div>
                        <div class="card" style="height: 80vh; width: 120vh; margin-right: 30px; text-align: center">
                            <h2 class="font-bold mb-6 text-max" style="margin-bottom: 2em">Опрос закончен!</h2>
                            <Button label="Сохранить ответы и перейти к результатам опроса" severity="info" class="p-button-success text-xl" @click="$emit('goToResults')"></Button>
                        </div>
                    </div>
                    <!-- дублирование карточки??? как то это исправить-->
                    <div>
                        <div class="card" style="text-align: center">
                            <p style="margin-bottom: 1em">Получено ответов: <br /><span class="question-number">нет ответов</span></p>
                            <p>Правильных ответов: <br /><span class="question-number">нет ответов</span></p>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div class="flex flex-col md:flex-row">
                        <div>
                            <div class="card" style="height: 80vh; width: 120vh; margin-right: 30px">
                                <div style="height: 100%; display: flex; flex-direction: column">
                                    <span class="font-semibold text-xl">Вопрос {{ currentQuestionIndex + 1 }} / {{ quizData.questions.length }}</span>
                                    <div class="centered-content">
                                        <h2 class="layout-menu-category font-bold mb-12 text-max">{{ currentQuestion.text }}</h2>
                                        <div>
                                            <ul class="sections-list">
                                                <li v-for="(option, index) in currentQuestion.options" :key="index" class="section-item">
                                                    <span class="option-label font-bold text-xl">{{ ['А', 'Б', 'В', 'Г'][index] }}.</span>
                                                    <div class="option-text text-xl">
                                                        {{ option }}
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div class="action-buttons" style="margin-top: auto">
                                        <Button label="Назад" :disabled="currentQuestionIndex === 0" class="p-button-secondary" @click="prevQuestion" />
                                        <!-- Проверяем, если это последний вопрос, показываем кнопку "Завершить опрос", иначе "Вперед" -->
                                        <Button label="Вперед" v-if="currentQuestionIndex < quizData.questions.length - 1" :disabled="currentQuestionIndex === quizData.questions.length - 1" class="p-button-secondary" @click="nextQuestion" />
                                        <Button label="Завершить опрос" severity="info" v-else class="p-button-success" @click="finishQuiz" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="card" style="text-align: center">
                                <p style="margin-bottom: 1em">
                                    Получено ответов: <br /><span class="question-number">{{ answersReceived }}</span>
                                </p>
                                <p>
                                    Правильных ответов: <br /><span class="question-number">{{ correctAnswers }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.topbar {
    height: 4rem;
    z-index: 997;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0 2rem;
    background-color: var(--surface-card);
    transition: left var(--layout-section-transition-duration);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.back-btn {
    font-size: 15px;
}

.layout-menuitem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
}

.survey-title-input {
    font-size: 24px;
    font-weight: bold;
}

.content {
    display: flex;
    flex-grow: 1;
}

.main-content {
    flex-grow: 1;
    padding: 20px 20px 20px 0;
    margin: 10px 10px 10px 0;
}
.question-number {
    padding: 4px 8px;
    font-weight: 400;
    color: white;
    background-color: #0ea5e9;
    border-radius: 3px;
}
.sidebar {
    width: 20rem;
    height: 80vh;
    z-index: 999;
    overflow-y: auto;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    top: 6rem;
    left: 2rem;
    transition:
        transform var(--layout-section-transition-duration),
        left var(--layout-section-transition-duration);
    background-color: var(--surface-overlay);
    border-radius: var(--content-border-radius);
    margin: 30px 3.5rem;
    padding: 0 1.5rem;
}
.text-max {
    font-size: 2.2em;
    text-align: center;
}
.centered-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    margin-top: 15vh;
}
.sections-list {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Две колонки */
    gap: 1rem; /* Отступы между элементами */
    padding: 1rem;
}

.section-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 5px;
}
.action-buttons {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    width: 100%;
}
</style>
