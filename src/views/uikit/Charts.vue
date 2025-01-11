<script setup>
import { computed, ref } from 'vue';
// Данные для графика
const barData = ref(null);
//const barOptions = ref(null);
// Значения для фильтров
const multiselectValues = ref([
    { name: '5А', id: 1 },
    { name: '6А', id: 2 },
    { name: '7А', id: 3 }
]);
const dropdownValues = ref([
    { name: 'тест1', id: 1 },
    { name: 'тест2', id: 2 }
]);
// Выбранные значения фильтров
const multiselectValue = ref([]);
const dropdownValue = ref(null);
// Фейковые данные с результатами опросов
const surveyResults = ref([
    // Тест 1
    {
        class_id: 1,
        survey_id: 1,
        results: [
            { question_id: 1, correctAnswers: 5, totalAnswers: 10 },
            { question_id: 2, correctAnswers: 6, totalAnswers: 10 }
        ]
    },
    {
        class_id: 2,
        survey_id: 1,
        results: [
            { question_id: 1, correctAnswers: 8, totalAnswers: 12 },
            { question_id: 2, correctAnswers: 7, totalAnswers: 12 }
        ]
    },
    {
        class_id: 3,
        survey_id: 1,
        results: [
            { question_id: 1, correctAnswers: 4, totalAnswers: 8 },
            { question_id: 2, correctAnswers: 6, totalAnswers: 8 }
        ]
    },
    // Тест 2
    {
        class_id: 1,
        survey_id: 2,
        results: [
            { question_id: 1, correctAnswers: 7, totalAnswers: 14 },
            { question_id: 2, correctAnswers: 8, totalAnswers: 14 }
        ]
    },
    {
        class_id: 2,
        survey_id: 2,
        results: [
            { question_id: 1, correctAnswers: 10, totalAnswers: 15 },
            { question_id: 2, correctAnswers: 12, totalAnswers: 15 }
        ]
    },
    {
        class_id: 3,
        survey_id: 2,
        results: [
            { question_id: 1, correctAnswers: 5, totalAnswers: 10 },
            { question_id: 2, correctAnswers: 7, totalAnswers: 10 }
        ]
    }
]);
// Построение графика на основе выбранных фильтров
function generateChart() {
    if (!dropdownValue.value) {
        alert('Выберите тест');
        return;
    }
    if (!multiselectValue.value.length) {
        alert('Выберите хотя бы один класс');
        return;
    }
    // Фильтруем данные по выбранному тесту и классам
    const filteredData = surveyResults.value.filter((data) => data.survey_id === dropdownValue.value.id && multiselectValue.value.some((classItem) => classItem.id === data.class_id));
    // Формируем данные для графика
    const labels = filteredData.map((data) => {
        const classInfo = multiselectValues.value.find((c) => c.id === data.class_id);
        return classInfo ? classInfo.name : `Класс ${data.class_id}`;
    });
    const data = filteredData.map((data) => {
        const totalCorrectAnswers = data.results.reduce((sum, r) => sum + r.correctAnswers, 0);
        const totalAnswers = data.results.reduce((sum, r) => sum + r.totalAnswers, 0);
        return Math.round((totalCorrectAnswers / totalAnswers) * 100); // Процент правильных ответов
    });
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500');
    barData.value = {
        labels,
        datasets: [
            {
                label: 'Процент правильных ответов',
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                data
            }
        ]
    };
}
const barOptionsComputed = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    return {
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    beginAtZero: true // Начало оси Y с 0
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
});
</script>

<template>
    <div class="flex flex-col md:flex-row">
        <div className="card" style="min-width: 120vh; margin-right: 30px">
            <!-- Заголовок -->
            <div class="flex" style="gap: 0.5rem; align-items: stretch">
                <i class="pi pi-chart-line" style="font-size: 2.3rem"></i>
                <h2 class="font-semibold text-4xl mb-6">Общая статистика</h2>
            </div>
            <div class="font-semibold text-xl mb-4">Статистика правильных ответов</div>
            <Chart type="bar" :data="barData" :options="barOptionsComputed"></Chart>
        </div>
        <div class="flex flex-col">
            <!-- Фильтр тестов -->
            <div class="card">
                <div class="font-semibold text-xl">Фильтрация по тестам</div>
                <Select v-model="dropdownValue" :options="dropdownValues" optionLabel="name" placeholder="Выберите тест"></Select>
            </div>
            <!-- Фильтр классов -->
            <div class="card">
                <div class="font-semibold text-xl">Фильтрация по классам</div>
                <MultiSelect v-model="multiselectValue" :options="multiselectValues" optionLabel="name" placeholder="Выберите классы" :filter="true"></MultiSelect>
            </div>
            <!-- Кнопка генерации графика -->
            <Button label="Составить график" @click="generateChart" class="mt-2" severity="info"></Button>
        </div>
    </div>
</template>

<style scoped></style>
