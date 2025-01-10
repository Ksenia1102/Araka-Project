<script setup>
import { useLayout } from '@/layout/composables/layout';
import { NodeService } from '@/service/NodeService';
import { ProductService } from '@/service/ProductService';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { onMounted, ref, watch, computed } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const products = ref(null);
const chartData = ref(null);
const chartOptions = ref(null);
const treeValue = ref(null);
const treeTableValue = ref(null);
const surveys = ref([]); // Это будет хранить список опросов
const searchQuery = ref(''); // Введённый текст для поиска
function getUserIdFromToken() {
    const token = localStorage.getItem('authToken'); // Или другой способ получения токена
    console.log(token);
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        return decoded.id; // Зависит от структуры вашего токена
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return null;
    }
}

onMounted(async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
        console.error('ID пользователя не найден.');
        return;
    }
    const token = localStorage.getItem('authToken');
    console.log(userId);
    try {
        // Отправка GET запроса на сервер
        const response = await axios.get(`http://localhost:3000/api/surveys1/user/${userId}`, {
            headers: {
                token: token // Добавляем токен в заголовки
            }
        });
        surveys.value = response.data; // Сохраняем полученные данные в переменную
        console.log('Полученные данные:', surveys.value); // Выводим данные в консоль
    } catch (error) {
        console.error('Ошибка при загрузке опросов:', error);
    }
});

// Вычисляемое свойство для фильтрации данных
const filteredSurveys = computed(() => surveys.value.filter((survey) => survey.title.toLowerCase().includes(searchQuery.value.toLowerCase())));

// Форматирование даты
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('ru-RU', options);
}
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
                { id: 2, name: 'Untitled Set', modified: new Date() }
                // Добавьте другие опросы, если нужно
            ],
            selectedSurvey: null
        };
    },
    methods: {
        // goToSurvey(surveyId) {

        //     this.$router.push(`/uikit/working/${surveyId}`);
        // },
        goToSurvey(surveyId) {
            // Логика перехода к выбранному опросу
            console.log('Переход');
            this.$router.push({ path: `/uikit/sur-data/${surveyId}` });
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
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-book" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Библиотека</h2>
        </div>

        <!-- Поле для поиска -->
        <div class="card flex flex-col gap-4 w-full" style="padding: initial">
            <Toolbar>
                <template #start>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <!-- Привязываем v-model -->
                        <InputText v-model="searchQuery" placeholder="Поиск по опросам" style="width: 100%" />
                    </IconField>
                </template>
            </Toolbar>
        </div>

        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Опросы</div>
        <!-- Таблица с данными -->
        <DataTable :value="filteredSurveys" class="p-datatable-sm">
            <!-- Столбец для имени опроса (title) -->
            <Column field="title" header="Имя" />

            <!-- Столбец для даты создания (created_at) -->
            <Column field="created_at" header="Дата создания">
                <template #body="slotProps">
                    <!-- Форматируем дату перед выводом -->
                    <span>{{ formatDate(slotProps.data.created_at) }}</span>
                </template>
            </Column>

            <!-- Столбец для кнопки перехода -->
            <Column style="padding: 1.5rem" header="">
                <template #body="slotProps">
                    <!-- Стрелочка для перехода на детальную страницу опроса -->
                    <!-- <button @click="goToSurvey(slotProps.data.id)" class="arrow-button">➔</button> -->
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
