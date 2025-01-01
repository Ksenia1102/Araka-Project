<script setup>
import { onMounted, ref } from 'vue';
// import { useRoute, useRouter } from 'vue-router';

// Данные для графиков
const barData = ref(null);
const barOptions = ref(null);

// Фейковые данные для правильных ответов
const correctAnswersData = [
    { question: 'Вопрос 1', correct: 3 },
    { question: 'Вопрос 2', correct: 4 },
    { question: 'Вопрос 3', correct: 2 },
    { question: 'Вопрос 4', correct: 5 },
    { question: 'Вопрос 5', correct: 5 },
    { question: 'Вопрос 6', correct: 5 },
    { question: 'Вопрос 7', correct: 5 },
    { question: 'Вопрос 8', correct: 5 },
    { question: 'Вопрос 9', correct: 5 },
    { question: 'Вопрос 10', correct: 5 },
    { question: 'Вопрос 11', correct: 5 },
    { question: 'Вопрос 12', correct: 5 },
    { question: 'Вопрос 13', correct: 5 },
    { question: 'Вопрос 14', correct: 25 }
];

onMounted(() => {
    setColorOptions();
});

function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500');

    // Данные для столбчатого графика
    barData.value = {
        labels: correctAnswersData.map((data) => data.question), // Метки — номера вопросов
        datasets: [
            {
                label: 'Правильные ответы',
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                data: correctAnswersData.map((data) => data.correct) // Значения — количество правильных ответов
            }
        ]
    };

    // Опции для графика
    barOptions.value = {
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
}

// Наблюдаем за изменением маршрута (смена класса)
// watch(
//     () => route.params.classId,
//     () => {
//         handleClassChange(); // Обновляем данные и имя класса
//     }
// );
</script>

<template>
    <div class="card">
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-users" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Класс IDClass</h2>
        </div>
        <div class="grid grid-cols-12 gap-8">
            <!-- График правильных ответов -->
            <div class="col-span-12">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Статистика правильных ответов</div>
                    <Chart type="bar" :data="barData" :options="barOptions"></Chart>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sections-list {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Две колонки */
    gap: 1rem; /* Отступы между элементами */
    padding: 1rem;
}

.section-item {
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    background-color: #f9f9f9;
    transition: background-color 0.3s ease;
}

.section-item:hover {
    background-color: #e6f7ff; /* Цвет при наведении */
}
.form-container {
    display: flex;
    gap: 1rem;
}

.form-column {
    flex: 1;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.preview-table th,
.preview-table td {
    padding: 0.5rem;
    border: 1px solid #ddd;
}
</style>
