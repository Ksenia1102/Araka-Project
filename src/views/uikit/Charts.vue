<script setup>
import axios from 'axios';
import MultiSelect from 'primevue/multiselect';
import OverlayPanel from 'primevue/overlaypanel';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
const toast = useToast();
const filterPanel = ref();
// Данные для графика
const barData = ref(null);
const apiUrl = import.meta.env.VITE_API_URL;
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
onMounted(() => {
    loadFilters();
});
const toggleFilter = (event) => {
    filterPanel.value.toggle(event);
};

async function loadFilters() {
    try {
        const token = localStorage.getItem('authToken');
        const { data } = await axios.get(`${apiUrl}/charts/filters`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        console.log('Полученные фильтры:', data); // <--- вот это

        multiselectValues.value = data.classes;
        dropdownValues.value = data.tests;
    } catch (error) {
        console.error('Ошибка загрузки фильтров:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить фильтры',
            life: 3000
        });
    }
}

// Построение графика на основе выбранных фильтров
async function generateChart() {
    const token = localStorage.getItem('authToken');
    if (!dropdownValue.value || !multiselectValue.value.length) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Выберите тест и хотя бы один класс',
            life: 3000
        });
        return;
    }
    
    try {
        const classIds = multiselectValue.value.map(c => c.id);
        const { data } = await axios.post(
            `${apiUrl}/charts/stats`,
            {
                surveyId: dropdownValue.value.id,
                classIds
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );



        const labels = classIds.map(id => {
            const cls = multiselectValues.value.find(c => c.id === id);
            return cls?.name || `Класс ${id}`;
        });

        const datasetData = classIds.map(id => {
            const entry = data.find(d => d.class_id === id);
            if (!entry || entry.totalAnswers === 0) return 0;
            return Math.round((entry.correctAnswers / entry.totalAnswers) * 100);
        });

        const documentStyle = getComputedStyle(document.documentElement);
        const primaryColor = documentStyle.getPropertyValue('--p-primary-500');

        barData.value = {
            labels,
            datasets: [{
                label: 'Процент правильных ответов',
                backgroundColor: primaryColor,
                data: datasetData
            }]
        };

        filterPanel.value.hide();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить статистику',
            life: 3000
        });
    }
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
                        return value + '%'; 
                    }
                },
                suggestedMax: 100, 
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
