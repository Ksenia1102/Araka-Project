<script setup>
import { onMounted, ref } from 'vue';

const currentQuestion = ref(null);
const surveyInfo = ref(null);
//const noActiveSurvey = ref(false);
const isLoading = ref(true);
//const errorMessage = ref('');
const students = ref([]);

// Генерация липовых данных
function generateMockData() {
    // Информация о тесте
    surveyInfo.value = {
        title: 'Контрольная работа по математике',
        class: '8Б',
        class_id: 42,
        mediaUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHxTMRg_AGlBEi89MFsWCdac271-UdPU-ysw&s',
        mediaType: 'image'
    };

    // Текущий вопрос
    currentQuestion.value = {
        question_text: 'Решите квадратное уравнение: x² - 5x + 6 = 0',
        options: {
            A: 'x₁ = 2, x₂ = 3',
            B: 'x₁ = 1, x₂ = 6',
            C: 'x₁ = -2, x₂ = -3',
            D: 'Нет решения'
        }
    };

    // Список студентов
    students.value = [
        { id: 1, name: 'Иванов Иван', aruco_num: 1234 },
        { id: 2, name: 'Петров Петр', aruco_num: 1235 },
        { id: 3, name: 'Сидорова Мария', aruco_num: 1236 },
        { id: 4, name: 'Кузнецов Алексей', aruco_num: 1237 },
        { id: 5, name: 'Смирнова Анна', aruco_num: 1238 },
        { id: 6, name: 'Васильев Дмитрий', aruco_num: 1239 },
        { id: 7, name: 'Николаева Елена', aruco_num: 1240 },
        { id: 8, name: 'Федоров Сергей', aruco_num: 1241 },
        { id: 9, name: 'Николаева Елена', aruco_num: 1240 },
        { id: 10, name: 'Федоров Сергей', aruco_num: 1241 },
        { id: 11, name: 'Николаева Елена', aruco_num: 1240 },
        { id: 12, name: 'Кузнецов Алексей', aruco_num: 1237 },
        { id: 13, name: 'Смирнова Анна', aruco_num: 12 },
        { id: 14, name: 'Васильев Дмитрий', aruco_num: 1239 },
        { id: 15, name: 'Николаева Елена', aruco_num: 1240 },
        { id: 16, name: 'Федоров Сергей', aruco_num: 1241 },
        { id: 17, name: 'Николаева Елена', aruco_num: 1240 },
        { id: 18, name: 'Федоров Сергей', aruco_num: 1241 },
        { id: 19, name: 'НиколаеваПетросян-Колся Елена', aruco_num: 1240 }
    ];

    isLoading.value = false;
}

onMounted(() => {
    // Имитация загрузки данных
    setTimeout(() => {
        generateMockData();
    }, 1000);
});
</script>

<template>
    <div class="quiz-layout">
        <!-- Верхнее меню -->
        <div class="topbar">
            <span></span>
            <div class="survey-title">
                <h1 class="survey-title-input">{{ surveyInfo?.title }}</h1>
            </div>
            <div class="flex items-center">
                <span class="ques-num" style="margin-right: 0.2em">Класс:</span>
                <h2>{{ surveyInfo?.class }}</h2>
            </div>
        </div>

        <!-- Основное содержимое -->
        <div v-if="isLoading" class="flex justify-content-center">
            <ProgressSpinner />
        </div>

        <div v-else-if="noActiveSurvey || errorMessage" class="text-center p-4">
            <i class="pi pi-info-circle" style="font-size: 2rem"></i>
            <h2>{{ errorMessage || 'Активный тест не найден' }}</h2>
            <p class="text-sm">Страница обновится при запуске теста</p>
        </div>

        <div v-else class="content">
            <!-- Боковое меню -->
            <div class="sidebar">
                <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0">
                    <li class="layout-menu-category font-semibold text-xl mb-4">Участники</li>
                    <li v-for="student in students" :key="student.id" class="student-row mb-5">
                        <span class="student-name">{{ student.name }}</span>
                        <span class="aruco-num"> {{ student.aruco_num }}</span>
                    </li>
                </ul>
            </div>

            <!-- Основной контент -->
            <div class="main-content">
                <div>
                    <div>
                        <div class="card" style="min-height: 80vh">
                            <div style="height: 100%; display: flex; flex-direction: column">
                                <span class="font-semibold text-xl">Текущий вопрос:</span>
                                <div class="centered-content">
                                    <h2 v-breakwords:[20]="currentQuestion.question_text" class="layout-menu-category font-bold text-max"></h2>

                                    <div v-if="surveyInfo.mediaUrl" class="image-preview">
                                        <img v-if="surveyInfo.mediaType === 'image'" :src="surveyInfo.mediaUrl" class="uploaded-image" />
                                        <video v-else-if="surveyInfo.mediaType === 'video'" :src="surveyInfo.mediaUrl" controls class="uploaded-image"></video>
                                        <audio v-else-if="surveyInfo.mediaType === 'audio'" :src="surveyInfo.mediaUrl" controls class="uploaded-image"></audio>
                                    </div>

                                    <div v-else class="image-placeholder"></div>

                                    <div>
                                        <ul class="sections-list">
                                            <li v-for="(option, key) in currentQuestion.options" :key="key" class="section-item">
                                                <span class="option-label font-bold text-xl">{{ key }}.</span>
                                                <div class="option-text text-xl">
                                                    {{ option }}
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.student-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.student-name {
    flex: 1;
    min-width: 0; /* важно для работы text-overflow */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.aruco-num {
    flex-shrink: 0;
    color: #0c94e3;
}

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
.ques-num {
    padding: 4px 8px;
    font-weight: 400;
    color: white;
    background-color: #0ea5e9;
    border-radius: 3px;
}
.sidebar {
    min-width: 20rem;
    min-height: 80vh;
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

/* Контейнер для изображения */
.image-preview audio {
    margin: 10vh 0;
}

/* Стил для изображения */
.image-placeholder {
    /* height: 20vh; */
    margin: 15vh 0;
    width: 100%;
}
.centered-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    /* margin-top: 15vh; */
}

/* .sections-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
} */

.section-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    /* text-align: center; */
    background-color: #f9f9f9;
    /* transition: background-color 0.3s ease; */
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s;
}
.action-buttons {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.text-max {
    font-size: 2.2em;
    text-align: center;
}

/* .sidebar {
    width: 20rem;
    height: 80vh;
    overflow-y: auto;
    border-radius: var(--content-border-radius);
    padding: 0 1.5rem;
} */
/*
.ques-num {
    padding: 4px 8px;
    font-weight: 400;
    color: white;
    background-color: #0ea5e9;
    border-radius: 3px;
} */
</style>
