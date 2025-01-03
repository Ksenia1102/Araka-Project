<!-- <script setup>
import { computed, ref } from 'vue';
// export default {
//     props: {
//         title: {
//             type: String,
//             default: 'Заголовок страницы'
//         }
//     },
//     methods: {
//         goBack() {
//             this.$emit('goBack');
//         }
//     }
// };
const sections = ref([
    { id: 0, name: 'На ноге' },
    { id: 1, name: 'На руке' },
    { id: 2, name: 'На носу' },
    { id: 3, name: 'На спине' }
]);
const model = computed(() => {
    return [
        {
            label: 'Участники',
            items: [
                { label: 'Алексей Прохоров' },
                { label: 'Анна Ахматовававав' },
                { label: 'Алексей Проerereхоров' },
                { label: 'Алексей Прохerereоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Проdfdfdхоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' },
                { label: 'Алексей Прохоров' }
            ]
        }
    ];
});
</script>
<template>
    <div class="quiz-layout">
        <div class="topbar">
            <Button @click="$emit('goBack')" icon="pi pi-chevron-left" class="back-btn" text severity="secondary"></Button>
            <div class="survey-title">
                <h1 class="survey-title-input">Опрос</h1>
            </div>
            <div class="flex items-center">
                <Button label="ЗАПУСТИТЬ" class="back-btn" severity="info" style="margin-right: 5px"></Button>
                <h2>ДЛЯ 10В</h2>
            </div>
        </div>
        <div class="content">
            <div class="sidebar">
                <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0">
                    <template v-for="(item, i) in model" :key="i">
                        <li v-if="item.label" class="layout-menu-category font-semibold text-xl mb-4">{{ item.label }}</li>
                        <template v-for="(subItem, j) in item.items" :key="j">
                            <li class="layout-menuitem" :class="{ 'active-menuitem': isHovered === j, 'selected-question': selectedQuestionIndex === j }" @mouseenter="isHovered = j" @mouseleave="isHovered = null">
                                <div class="layout-menuitem-link">
                                    <span class="layout-menuitem-text">{{ subItem.label }}</span>
                                </div>
                                <div class="layout-menuitem-actions">
                                    <span class="question-number">1</span>
                                </div>
                            </li>
                        </template>
                    </template>
                </ul>
            </div>
            <div class="main-content">
                <div class="flex flex-col md:flex-row">
                    <div>
                        <div class="card" style="height: 80vh; width: 120vh; margin-right: 30px">
                            <div>
                                <span class="font-semibold text-xl">Вопрос 18/20</span>
                                <div class="flex flex-col">
                                    <h2 class="layout-menu-category font-bold text-xl mb-7">Вопрос</h2>
                                    <div>
                                        <ul class="sections-list">
                                            <li v-for="section in sections" :key="section.id" class="section-item">
                                                <span class="option-label">{{ ['А', 'Б', 'В', 'Г'][section.id] }}.</span>
                                                <div>
                                                    {{ section.name }}
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="card">
                            <span class="text-muted-color">since last week</span>
                        </div>
                        <div class="card">
                            <span class="text-muted-color">since last week</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template> -->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
// Фейковые данные для опроса
const quizData = ref({
    questions: [
        {
            text: 'Какое животное символизирует мудрость?',
            options: ['Сова', 'Кошка', 'Лиса', 'Волк']
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
const timeRemaining = ref(10); // Секунд до конца вопроса
const answersReceived = ref(0); // Количество ответов
const correctAnswers = ref(0); // Количество правильных ответов
const quizFinished = ref(false); // Флаг завершения опроса
// Таймер
const QUESTION_DURATION = 10; // 30 секунд
let interval = null;
const startQuiz = () => {
    quizFinished.value = false;
    resetStats();
    resetTimer();
    interval = setInterval(() => {
        if (timeRemaining.value > 0) {
            timeRemaining.value--;
            simulateAnswers(); // Эмуляция ответов
        } else if (currentQuestionIndex.value < quizData.value.questions.length - 1) {
            currentQuestionIndex.value++;
            currentQuestion.value = quizData.value.questions[currentQuestionIndex.value];
            resetStats();
            resetTimer();
        } else {
            clearInterval(interval); // Завершаем таймер
            quizFinished.value = true;
        }
    }, 1000); // Обновляем каждую секунду
};
// Сброс таймера
const resetTimer = () => {
    timeRemaining.value = QUESTION_DURATION;
};
// Сброс статистики
const resetStats = () => {
    answersReceived.value = 0;
    correctAnswers.value = 0;
};
// Эмуляция ответов
const simulateAnswers = () => {
    if (answersReceived.value < studentModel.value[0].items.length) {
        answersReceived.value++;
    }
    if (correctAnswers.value < answersReceived.value) {
        correctAnswers.value++;
    }
};
// Чистим интервал при размонтировании компонента
onMounted(startQuiz);
onUnmounted(() => {
    if (interval) clearInterval(interval);
});
</script>
<template>
    <div class="quiz-layout">
        <!-- Верхнее меню -->
        <div class="topbar">
            <Button @click="$emit('goBack')" icon="pi pi-chevron-left" class="back-btn" text severity="secondary"></Button>
            <div class="survey-title">
                <h1 class="survey-title-input">Опрос</h1>
            </div>
            <div class="flex items-center">
                <Button label="ЗАПУЩЕН" class="back-btn" severity="info" style="margin-right: 5px"></Button>
                <h2>ДЛЯ КЛАССА ID: {{ quizData.classId }}</h2>
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
                <div v-if="quizFinished" class="card" style="height: 80vh; width: 120vh; margin-right: 30px">
                    <h2 class="text-success">Опрос закончен! Все ответы были сохранены!</h2>
                    <Button label="Перейти к результатам опроса" class="p-button-success" @click="$emit('goToResults')"></Button>
                </div>
                <div v-else>
                    <div class="flex flex-col md:flex-row">
                        <div>
                            <div class="card" style="height: 80vh; width: 120vh; margin-right: 30px">
                                <div>
                                    <span class="font-semibold text-xl">Вопрос {{ currentQuestionIndex + 1 }} / {{ quizData.questions.length }}</span>
                                    <div class="flex flex-col">
                                        <h2 class="layout-menu-category font-bold text-xl mb-7">{{ currentQuestion.text }}</h2>
                                        <div>
                                            <ul class="sections-list">
                                                <li v-for="(option, index) in currentQuestion.options" :key="index" class="section-item">
                                                    <span class="option-label">{{ ['А', 'Б', 'В', 'Г'][index] }}.</span>
                                                    <div>
                                                        {{ option }}
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="card">
                                <!-- Отображение таймера -->
                                <span class="font-semibold text-l">Оставшееся время: {{ timeRemaining }} сек</span>
                            </div>
                            <div class="card">
                                <p class="font-bold text-xl">Получено ответов: {{ answersReceived }}</p>
                                <p class="font-bold text-xl">Правильных ответов: {{ correctAnswers }}</p>
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
    font-weight: bold;
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
.sections-list {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Две колонки */
    gap: 1rem; /* Отступы между элементами */
    padding: 1rem;
}
.section-item {
    padding: 1rem;
    text-align: center;
    background-color: #f9f9f9;
    transition: background-color 0.3s ease;
}
</style>
