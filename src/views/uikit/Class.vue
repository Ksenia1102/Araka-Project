<!-- <script setup>
import { CustomerService } from '@/service/CustomerService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

import { onBeforeMount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentClassName = ref(''); // Текущее название класса
const filters1 = ref(null);
const customers1 = ref(null);
const customers2 = ref(null);
const loading1 = ref(null);
const customers3 = ref(null);

const display = ref(false);

function addStudent() {
    display.value = true;
}
function close() {
    display.value = false;
}

// Функция для извлечения имени класса из параметров маршрута
function updateClassName() {
    currentClassName.value = route.params.classId || 'Класс не выбран';
}

// Инициализация и наблюдение за изменениями маршрута
onMounted(() => {
    updateClassName();
});

onBeforeMount(() => {
    CustomerService.getCustomersLarge().then((data) => {
        customers1.value = data;
        loading1.value = false;
        customers1.value.forEach((customer) => (customer.date = new Date(customer.date)));
    });
    CustomerService.getCustomersLarge().then((data) => (customers2.value = data));
    CustomerService.getCustomersMedium().then((data) => (customers3.value = data));

    initFilters1();
});

function initFilters1() {
    filters1.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        'country.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        representative: { value: null, matchMode: FilterMatchMode.IN },
        date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
        balance: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        activity: { value: [0, 100], matchMode: FilterMatchMode.BETWEEN },
        verified: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}
function formatCurrency(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

watch(
    () => route.params.classId,
    () => {
        updateClassName();
    }
);
</script>

<template>
    <div class="card" style="height: 100vh">

        <div>
            <div class="font-semibold text-xl mb-4">Вы почти закончили с классом {{ currentClassName }}</div>
            <p>Завершите создание, добавив учеников</p>
            <Button label="Добавить учеников" icon="pi pi-plus" @click="addStudent" class="p-button-success" />
            <Dialog header="Добавить учеников в {{ currentClassName }}" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '50vw' }" :modal="true">
                <p class="leading-normal m-0 mb-4">Введите имена учащихся в поле ниже. Вы также можете скопировать и вставить строки и столбцы из электронной таблицы. Убедитесь, что каждый учащийся указан в новой строке.</p>
                <div class="form-container">
                    <Textarea style="width: 50vh"></Textarea>
                </div>
                <Button label="Добавить" @click="close" class="import-btn" severity="info" icon="pi pi-plus-circle" style="width: -webkit-fill-available" />
            </Dialog>
        </div>


        <div hidden>
            <div class="flex" style="gap: 0.5rem; align-items: stretch">
                <i class="pi pi-users" style="font-size: 2.3rem"></i>
                <h2 class="font-semibold text-4xl mb-6">Класс {{ currentClassName }}</h2>
            </div>

            <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Ученики</div>


            <DataTable
                :value="customers1"
                :paginator="true"
                :rows="8"
                dataKey="id"
                :rowHover="true"
                v-model:filters="filters1"
                filterDisplay="menu"
                :loading="loading1"
                :filters="filters1"
                :globalFilterFields="['name', 'country.name', 'representative.name', 'balance', 'status']"
                showGridlines
            >
                <template #header>
                    <div class="flex justify-between">
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters1['global'].value" placeholder="Быстрый поиск" />
                        </IconField>
                    </div>
                </template>
                <template #empty> No customers found. </template>
                <template #loading> Loading customers data. Please wait. </template>
                <Column field="name" header="Имя">
                    <template #body="{ data }">
                        {{ data.name }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                    </template>
                </Column>
                <Column field="name" header="Фамилия">
                    <template #body="{ data }">
                        {{ data.name }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                    </template>
                </Column>
                <Column header="Номер карточки" filterField="balance" dataType="numeric">
                    <template #body="{ data }">
                        {{ formatCurrency(data.balance) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputNumber v-model="filterModel.value" mode="currency" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template> -->

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const currentClassName = ref('');
const display = ref(false);
const studentInput = ref('');
const studentPreview = ref([]);
const students = ref([]);
const showStudentTable = ref(false);
let studentIdCounter = 1;
const quickAddInput = ref('');
const sections = ref([
    { id: 1, name: 'Опрос №1', link: '/section/1' },
    { id: 2, name: 'Опрос №2', link: '/section/2' },
    { id: 3, name: 'Опрос №3', link: '/section/3' },
    { id: 4, name: 'Опрос №4', link: '/section/4' }
]);

// Функция для извлечения имени класса из параметров маршрута
function updateClassName() {
    currentClassName.value = route.params.classId || 'Класс не выбран';
}

function goToSection(link) {
    router.push(link);
}

// Получить уникальный ключ для localStorage на основе ID класса
function getStorageKey() {
    return `class_${route.params.classId}`;
}

// Сохранение состояния для текущего класса
function saveClassData() {
    localStorage.setItem(
        getStorageKey(),
        JSON.stringify({
            students: students.value,
            showStudentTable: showStudentTable.value
        })
    );
}

// Загрузка состояния для текущего класса
function loadClassData() {
    const savedData = localStorage.getItem(getStorageKey());
    if (savedData) {
        const { students: savedStudents, showStudentTable: savedShowTable } = JSON.parse(savedData);
        students.value = savedStudents || []; // Загружаем список учеников
        showStudentTable.value = !!savedShowTable; // Устанавливаем состояние таблицы
    } else {
        students.value = []; // Если данных нет, сбрасываем список учеников
        showStudentTable.value = false; // Скрываем таблицу
    }

    // Сбрасываем счётчик ID для нового класса
    studentIdCounter = students.value.length > 0 ? students.value.length + 1 : 1;
}

function addStudent() {
    display.value = true;
    studentInput.value = '';
    studentPreview.value = [];
}

function generatePreview() {
    const lines = studentInput.value.trim().split('\n');
    studentPreview.value = lines
        .map((line) => {
            const [firstName, ...lastNameParts] = line.trim().split(' ');
            if (!firstName || lastNameParts.length === 0) return null;
            return { id: studentIdCounter++, firstName, lastName: lastNameParts.join(' ') };
        })
        .filter((student) => student);
}

function addStudentsToTable() {
    students.value = [...students.value, ...studentPreview.value];
    display.value = false;
    showStudentTable.value = true;
    saveClassData();
}

function quickAddStudent() {
    const [firstName, ...lastNameParts] = quickAddInput.value.trim().split(' ');
    if (!firstName || lastNameParts.length === 0) {
        alert('Введите имя и фамилию ученика');
        return;
    }

    students.value.push({
        id: studentIdCounter++,
        firstName,
        lastName: lastNameParts.join(' ')
    });

    quickAddInput.value = '';
    showStudentTable.value = true;
    saveClassData();
}

// Загрузка данных класса и обновление имени класса
function handleClassChange() {
    updateClassName(); // Обновляем имя класса
    loadClassData(); // Загружаем данные для класса
}

// Вызываем handleClassChange при загрузке компонента
onMounted(() => {
    handleClassChange();
});

// Наблюдаем за изменением маршрута (смена класса)
watch(
    () => route.params.classId,
    () => {
        handleClassChange(); // Обновляем данные и имя класса
    }
);
</script>

<template>
    <div class="card" style="height: 110vh">
        <!-- блок с созданием учеников -->
        <div v-if="!showStudentTable">
            <div class="font-semibold text-xl mb-4">Вы почти закончили с классом {{ currentClassName }}</div>
            <p>Завершите создание, добавив учеников</p>
            <Button label="Добавить учеников" icon="pi pi-plus" @click="addStudent" class="p-button-success" />
            <Dialog :header="`Добавить учеников в ${currentClassName}`" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '60vw' }" :modal="true">
                <p class="leading-normal m-0 mb-4">Введите имена учащихся в поле ниже. Каждый ученик должен быть указан в новой строке (например: *Иван Иванов*).</p>
                <div class="form-container">
                    <!-- Первая колонка -->
                    <div class="form-column">
                        <Textarea style="width: 100%; height: 200px" v-model="studentInput" placeholder="Введите имена и фамилии учеников..." @input="generatePreview" />
                    </div>

                    <!-- Вторая колонка - предпросмотр -->
                    <div class="form-column">
                        <p v-if="!studentPreview.length">Предпросмотр пуст.</p>
                        <table v-else class="preview-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Имя</th>
                                    <th>Фамилия</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(student, index) in studentPreview" :key="student.id">
                                    <td>{{ index + 1 }}</td>
                                    <td>{{ student.firstName }}</td>
                                    <td>{{ student.lastName }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <Button label="Добавить" @click="addStudentsToTable" class="import-btn" severity="info" icon="pi pi-plus-circle" style="width: -webkit-fill-available" />
            </Dialog>
        </div>

        <!-- блок с таблицей учеников -->
        <div v-if="showStudentTable">
            <div class="flex" style="gap: 0.5rem; align-items: stretch">
                <i class="pi pi-users" style="font-size: 2.3rem"></i>
                <h2 class="font-semibold text-4xl mb-6">Класс {{ currentClassName }}</h2>
            </div>
            <div class="font-semibold text-xl" style="border-bottom: 1px solid var(--surface-border)">Последние проведенные тесты</div>

            <div class="sections-list">
                <div v-for="section in sections" :key="section.id" class="section-item" @click="goToSection(section.link)">
                    {{ section.name }}
                    <i class="pi pi-fw pi-angle-right" />
                </div>
            </div>

            <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Ученики</div>
            <div>
                <!-- Поле для быстрого добавления ученика -->
                <div class="flex gap-2 items-center" style="margin-bottom: 10px">
                    <InputText v-model="quickAddInput" placeholder="Быстрое добавление ученика" style="width: 40vh" />
                    <Button label="Добавить" icon="pi pi-plus" @click="quickAddStudent" class="p-button-info" />
                    <!-- Новая кнопка для массового добавления -->
                    <Button label="Добавить нескольких" icon="pi pi-users" class="p-button-info" />
                </div>
                <!-- Кнопка добавления учеников -->
            </div>

            <!-- Таблица учеников -->
            <DataTable :value="students" :paginator="true" :rows="5" dataKey="id" :rowHover="true" filterDisplay="menu" :globalFilterFields="['firstName', 'lastName']" showGridlines>
                <template #header>
                    <div class="flex justify-between items-center">
                        <Button type="button" icon="pi pi-filter-slash" label="Очистить фильтр" outlined @click="clearFilter()" />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText placeholder="Быстрый поиск" />
                        </IconField>
                    </div>
                </template>
                <template #empty>Список учеников пуст.</template>
                <Column field="id" header="Номер карточки" />
                <Column field="firstName" header="Имя" />
                <Column field="lastName" header="Фамилия" />
            </DataTable>
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
