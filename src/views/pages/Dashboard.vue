<script setup>
import { useLayout } from '@/layout/composables/layout';
import { NodeService } from '@/service/NodeService';
import { ProductService } from '@/service/ProductService';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const products = ref(null);
const chartData = ref(null);
const chartOptions = ref(null);

const treeValue = ref(null);
const treeTableValue = ref(null);
//const selectedTreeTableValue = ref(null);

onMounted(() => {
    NodeService.getTreeNodes().then((data) => (treeValue.value = data));
    NodeService.getTreeTableNodes().then((data) => (treeTableValue.value = data));
});

// const items = ref([
//     { label: 'Add New', icon: 'pi pi-fw pi-plus' },
//     { label: 'Remove', icon: 'pi pi-fw pi-trash' }
// ]);

//разделы!!!
//import { useRouter } from 'vue-router';

//const router = useRouter();

// const sections = ref([
//     { id: 1, name: 'Раздел №1', link: '/section/1' },
//     { id: 2, name: 'Раздел №2', link: '/section/2' },
//     { id: 3, name: 'Раздел №3', link: '/section/3' },
//     { id: 4, name: 'Раздел №4', link: '/section/4' }
// ]);

// function goToSection(link) {
//     router.push(link);
// }
////

onMounted(() => {
    ProductService.getProductsSmall().then((data) => (products.value = data));
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
            {
                type: 'bar',
                label: 'Subscriptions',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                data: [4000, 10000, 15000, 4000],
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Advertising',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                data: [2100, 8400, 2400, 7500],
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Affiliate',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                data: [4100, 5200, 3400, 7400],
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: true,
                barThickness: 32
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}

// const formatCurrency = (value) => {
//     return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
// };

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<script>
export default {
    data() {
        return {
            surveys: [
                { id: 1, name: 'Опрос 1', modified: '2023-10-16' },
                { id: 2, name: 'Опрос 2', modified: new Date() }
                // Добавьте другие опросы, если нужно
            ],
            selectedSurvey: null
        };
    },
    methods: {
        // goToSurvey(surveyId) {

        //     this.$router.push(`/uikit/working/${surveyId}`);
        // },
        goToSurvey() {
            // Логика перехода к выбранному опросу
            this.$router.push(`/uikit/sur-data`);
        },
        formatDate(date) {
            // Функция для форматирования даты
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(date).toLocaleDateString('ru-RU', options);
        }
    }
};
</script>

<template>
    <div class="card">
        <!-- если не было опросов -->
        <div style="margin: 30px" hidden>
            <h1 class="font-semibold text-4xl mb-6">Вы еще не создавали опросы</h1>
            <p class="font-semibold text-xl mb-4">Проведите свой первый опрос и вы увидите их здесь!</p>
        </div>

        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-book" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Библиотека</h2>
        </div>

        <div class="card flex flex-col gap-4 w-full" style="padding: initial">
            <Toolbar>
                <template #start>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText placeholder="Поиск по опросам" style="width: 100%" />
                    </IconField>
                </template>

                <template #end>
                    <!-- <Button v-tooltip="'Click to proceed'" type="button" icon="pi pi-plus" class="mr-2" severity="secondary" text />
                    <Button v-tooltip="'Click to proceed'" type="button" icon="pi pi-print" class="mr-2" severity="secondary" text />
                    <Button v-tooltip="'Click to proceed'" type="button" icon="pi pi-upload" severity="secondary" text />
                    <Button v-tooltip="'Click to proceed'" type="button" icon="pi pi-upload" severity="secondary" text /> -->
                    <!-- <Button v-tooltip="'Click to proceed'" :model="items" type="button" icon="pi pi-ellipsis-v" severity="secondary" text /> -->
                </template>
            </Toolbar>

            <!-- <div class="font-semibold text-xl" style="border-bottom: 1px solid var(--surface-border)">Разделы</div>

            <div class="sections-list">
                <div v-for="section in sections" :key="section.id" class="section-item" @click="goToSection(section.link)">
                    {{ section.name }}
                    <i class="pi pi-fw pi-angle-right" />
                </div>
            </div> -->
        </div>

        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Опросы</div>
        <DataTable :value="surveys" class="p-datatable-sm">
            <Column field="name" header="Имя" />
            <Column field="modified" header="Последнее изменение">
                <template #body="slotProps">
                    <span>{{ formatDate(slotProps.data.modified) }}</span>
                </template>
            </Column>
            <Column style="padding: 1.5rem" header="">
                <template #body="slotProps">
                    <Button @click="goToSurvey(slotProps.data.id)" icon="pi pi-chevron-right" class="back-btn" text severity="secondary"></Button>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.sections-list {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Две колонки */
    gap: 1rem; /* Отступы между элементами */
    padding: 1rem;
    /* border: 1px solid #ddd;  */
    border-radius: 8px;
}

.section-item {
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    background-color: #f9f9f9;
    /* border: 1px solid #ccc; */
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.section-item:hover {
    background-color: #e6f7ff; /* Цвет при наведении */
}
.back-btn {
    cursor: pointer;
}
.arrow-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
}
.arrow-button:hover {
    background-color: #e5e7eb;
    border-radius: 5px;
}
</style>
