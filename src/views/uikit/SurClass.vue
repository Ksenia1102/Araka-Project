<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
// Получаем параметры маршрута и данные из query
const route = useRoute();
const classId = route.params.classId; // Получаем id класса
// Получаем опросы (surveys) из query
const surveys = ref([]);
if (route.query.surveys) {
    try {
        surveys.value = JSON.parse(route.query.surveys); // Разбираем список опросов
    } catch (error) {
        console.error('Ошибка при разборе данных опросов:', error);
    }
}
// Группируем опросы по месяцам
const groupedSurveys = computed(() => {
    const grouped = {};
    surveys.value.forEach((survey) => {
        if (!grouped[survey.month]) {
            grouped[survey.month] = [];
        }
        grouped[survey.month].push(survey);
    });
    return grouped;
});
// Функция для перехода к опросу
function goToSection(link) {
    // Здесь будет логика перехода
    console.log(`Переход по ссылке: ${link}`);
}
</script>
<template>
    <div class="card">
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-users" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Класс {{ classId }}</h2>
        </div>
        <div>
            <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--surface-border)">
                <div class="font-semibold text-xl">Пройденные классом опросы</div>
            </div>
            <!-- если не было опросов -->
            <div class="font-semibold text-xl" style="margin: 20px; text-align: center" v-if="Object.keys(groupedSurveys).length === 0">Опросы пока не проводились</div>
            <!-- Список опросов по месяцам -->
            <div v-else>
                <div v-for="(surveyList, month) in groupedSurveys" :key="month" class="month-section">
                    <h3 class="month-header">{{ month }}</h3>
                    <div class="sections-list">
                        <div v-for="survey in surveyList" :key="survey.id" class="section-item" @click="goToSection(survey.link)">
                            <div class="survey-details">
                                <div class="survey-name">{{ survey.name }}</div>
                                <div class="survey-completion">Пройден на: {{ survey.completion }}%</div>
                            </div>
                            <i class="pi pi-fw pi-angle-right" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.month-header {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 1rem 0;
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 0.5rem;
}
.sections-list {
    display: grid;
    gap: 1rem;
    padding: 1rem;
}
.section-item {
    padding: 1rem;
    margin: 1em 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    cursor: pointer;
    background-color: #f9f9f9;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    transition:
        background-color 0.3s ease,
        box-shadow 0.3s ease;
}
.section-item:hover {
    background-color: #e6f7ff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.survey-details {
    display: flex;
    flex-direction: column;
}
.survey-name {
    font-size: 1.2rem;
    font-weight: bold;
}
.survey-completion {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
}
</style>
