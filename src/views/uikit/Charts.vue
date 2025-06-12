<script setup>
import { useToast } from 'primevue/usetoast';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import OverlayPanel from 'primevue/overlaypanel';
import { computed, ref } from 'vue';
const toast = useToast();
const filterPanel = ref();
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
// Фейковые данные с результатами тестов
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
const toggleFilter = (event) => {
    filterPanel.value.toggle(event);
};
// Построение графика на основе выбранных фильтров
function generateChart() {
    if (!dropdownValue.value) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Выберите тест',
            life: 3000
        });
        return;
    }
    if (!multiselectValue.value.length) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Выберите хотя бы один класс',
            life: 3000
        });
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
    // Закрываем панель фильтров после применения
    filterPanel.value.hide();
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
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return context.parsed.y + '%';
                    }
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
                    beginAtZero: true,
                    callback: function (value) {
                        return value + '%'; // Добавляем символ процента
                    }
                },
                suggestedMax: 100, // Максимальное значение 100%
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
    <div>
        <div class="card">
            <!-- Заголовок -->
            <div class="flex" style="gap: 0.5rem; align-items: stretch">
                <i class="pi pi-chart-line" style="font-size: 2.3rem"></i>
                <h2 class="font-semibold text-4xl mb-6">Общая статистика</h2>
            </div>

            <!-- Кнопка фильтра с выпадающей панелью -->
            <div class="flex align-items-center gap-3 mb-4">
                <Button icon="pi pi-filter" @click="toggleFilter" severity="secondary" outlined aria-haspopup="true" aria-controls="filter-panel" class="p-button-sm" />
                <span class="font-semibold text-xl">Фильтрация</span>
            </div>

            <!-- Выпадающая панель фильтров -->
            <OverlayPanel ref="filterPanel" id="filter-panel" :showCloseIcon="true" :dismissable="true" style="width: 450px">
                <div class="flex flex-column items-end gap-3">
                    <!-- Фильтр по тестам -->
                    <div>
                        <label class="font-semibold block mb-2">По тестам</label>
                        <Select v-model="dropdownValue" :options="dropdownValues" optionLabel="name" placeholder="Выберите тест" class="w-full" />
                    </div>

                    <!-- Фильтр по классам -->
                    <div>
                        <label class="font-semibold block mb-2">По классам</label>
                        <MultiSelect v-model="multiselectValue" :options="multiselectValues" optionLabel="name" placeholder="Выберите классы" :filter="true" class="w-full" />
                    </div>

                    <!-- Кнопка применения фильтров -->
                    <Button label="Составить" @click="generateChart" severity="info" class="mt-2" />
                </div>
            </OverlayPanel>

            <!-- График -->
            <div class="font-semibold text-xl mb-4">Статистика правильных ответов</div>
            <Chart type="bar" :data="barData" :options="barOptionsComputed"></Chart>
        </div>
    </div>
</template>

<style scoped></style>
