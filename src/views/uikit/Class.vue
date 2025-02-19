<script setup>
import axios from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Локальное состояние поиска
const searchQuery = ref('');
const filters = ref({ global: { value: null, matchMode: 'contains' } });
const apiUrl = import.meta.env.VITE_API_URL;
// Слежение за изменением `searchQuery`
watch(searchQuery, (newValue) => {
    filters.value.global.value = newValue || null; // Присваиваем значение для глобального фильтра
});

// Ссылка на DataTable
const dataTableRef = ref(null);

const route = useRoute();
const router = useRouter();
const currentClassName = ref('');
const display = ref(false);
const studentInput = ref('');
const studentPreview = ref([]);
const students = ref([]);
const showStudentTable = ref(false);
const quickAddInput = ref('');
// Фейковые данные опросов
const surveys = ref([
    { id: 1, name: 'Опрос №1', link: '/uikit/chart-sur/1', completion: 85, month: 'Октябрь', isRecent: true },
    { id: 2, name: 'Опрос №2', link: '/uikit/chart-sur/2', completion: 90, month: 'Октябрь', isRecent: true },
    { id: 3, name: 'Опрос №3', link: '/uikit/chart-sur/3', completion: 70, month: 'Сентябрь', isRecent: false },
    { id: 4, name: 'Опрос №4', link: '/uikit/chart-sur/4', completion: 50, month: 'Сентябрь', isRecent: false },
    { id: 5, name: 'Опрос №5', link: '/uikit/chart-sur/5', completion: 95, month: 'Август', isRecent: false }
]);

// Фильтруем последние опросы
const recentSurveys = computed(() => surveys.value.filter((survey) => survey.isRecent));
function goToSection(surveyId) {
    router.push({
        name: 'chart-sur',
        params: {
            classId: route.params.classId, // classId
            surveyId: surveyId // surveyId
        },
        query: {
            className: currentClassName.value, // className
            students: JSON.stringify(students.value), // список студентов
            surveys: JSON.stringify(surveys.value) // передаем surveys
        }
    });
}

// Переход к списку опросов
function goToSurveys(classId) {
    router.push({
        name: 'sur-class', // маршрут для просмотра опросов
        params: {
            classId: classId // передаем id класса
        },
        query: {
            className: currentClassName.value, // className
            surveys: JSON.stringify(surveys.value) // передаем список опросов как query-параметр
        }
    });
}

// Обновление имени класса
function updateClassName() {
    currentClassName.value = route.params.title || 'Класс не выбран';
}

// Получение уникального ключа для localStorage
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

function addStudent() {
    display.value = true;
    studentInput.value = '';
    studentPreview.value = [];
}

// function addManyStudents() {
//     // display.value = true; // Открываем модальное окно
//     // studentInput.value = ''; // Очищаем ввод
//     // studentPreview.value = []; // Очищаем предпросмотр
//     alert('add');
// }

function generatePreview() {
    const lines = studentInput.value.trim().split('\n');
    studentPreview.value = lines
        .map((line, index) => {
            const [firstName, ...lastNameParts] = line.trim().split(' ');
            if (!firstName || lastNameParts.length === 0) return null;
            return { id: students.value.length + index + 1, firstName, lastName: lastNameParts.join(' ') };
        })
        .filter((student) => student);
}

async function addStudentsToTable() {
    const classId = route.params.classId;
    const studentsToAdd = studentPreview.value.map((student) => ({
        name: `${student.firstName} ${student.lastName}`
    }));

    if (!studentsToAdd.length) {
        alert('Список для добавления пуст.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        await axios.post(
            `${apiUrl}/api/save-students`,
            {
                class_id: classId,
                students: studentsToAdd
            },
            {
                headers: { token }
            }
        );

        // Обновляем список студентов после добавления
        await fetchStudents();

        // Очищаем предпросмотр и закрываем модальное окно
        studentPreview.value = [];
        studentInput.value = '';
        display.value = false;

        // Делаем таблицу видимой
        showStudentTable.value = true;
        saveClassData();
    } catch (error) {
        console.error('Ошибка при добавлении студентов:', error);
        alert('Не удалось добавить студентов. Попробуйте снова.');
    }
}

async function quickAddStudent() {
    const classId = route.params.classId;
    const quickInput = quickAddInput.value.trim();

    if (!quickInput) {
        alert('Введите имя и фамилию ученика.');
        return;
    }

    const [firstName, ...lastNameParts] = quickInput.split(' ');
    const lastName = lastNameParts.join(' ');

    if (!firstName || !lastName) {
        alert('Введите полное имя и фамилию ученика.');
        return;
    }

    const studentToAdd = { name: `${firstName} ${lastName}` };

    try {
        const token = localStorage.getItem('authToken');
        await axios.post(
            `${apiUrl}/api/save-students`,
            {
                class_id: classId,
                students: [studentToAdd]
            },
            {
                headers: { token }
            }
        );

        // Обновляем список студентов после добавления
        await fetchStudents();

        // Очищаем поле быстрого добавления
        quickAddInput.value = '';
        showStudentTable.value = true;
        saveClassData();
    } catch (error) {
        console.error('Ошибка при добавлении ученика:', error);
        alert('Не удалось добавить ученика. Попробуйте снова.');
    }
}

// Получение данных студентов с сервера
async function fetchStudents() {
    const classId = route.params.classId;

    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/get-students/${classId}`, {
            headers: { token }
        });

        // Обновляем данные, включая aruco_num
        students.value = response.data.map((student) => {
            const [firstName, ...lastNameParts] = student.name.split(' ');
            return {
                id: student.aruco_num, // Используем aruco_num как уникальный ID
                firstName: firstName || '',
                lastName: lastNameParts.join(' ') || ''
            };
        });
        showStudentTable.value = students.value.length > 0;
    } catch (error) {
        console.error('Ошибка при загрузке студентов:', error);
        alert('Не удалось загрузить список студентов.');
        students.value = [];
        showStudentTable.value = false;
    }
}

onMounted(() => {
    fetchStudents();
});

// Обработка изменения класса
function handleClassChange() {
    updateClassName(); // Обновляем имя класса
    fetchStudents(); // Загружаем список студентов с сервера
}

// Удаление ученика
const displayConfirmation = ref(false);

// Инициализация
onMounted(() => {
    handleClassChange();
});

// Наблюдение за изменением маршрута
watch(
    () => route.params.classId,
    () => {
        handleClassChange(); // Загружаем данные при смене класса
    }
);

// Удаление ученика
const studentToDelete = ref(null); // Держим ссылку на удаляемого ученика

async function deleteStudent(studentId) {
    const classId = route.params.classId;
    const token = localStorage.getItem('authToken');

    try {
        const response = await axios.delete(`${apiUrl}/api/delete-student/${classId}/${studentId}`, {
            headers: {
                token: token
            }
        });

        if (response.status === 200) {
            // Удаляем ученика из локального состояния
            students.value = students.value.filter((student) => student.id !== studentId);
            saveClassData(); // Сохраняем изменения
            alert('Студент успешно удалён.');
        } else {
            alert('Не удалось удалить ученика. Сервер вернул ошибку.');
        }
    } catch (error) {
        console.error('Ошибка при удалении ученика:', error);
        alert('Не удалось удалить ученика. Попробуйте снова.');
    } finally {
        closeConfirmation(); // Закрываем окно подтверждения
    }
}

function confirmDeletion(studentId) {
    studentToDelete.value = studentId; // Сохраняем ID удаляемого ученика
    displayConfirmation.value = true;
}

function closeConfirmation() {
    displayConfirmation.value = false;
    studentToDelete.value = null; // Сбрасываем выбранного ученика
}

function proceedWithDeletion() {
    if (studentToDelete.value !== null) {
        deleteStudent(studentToDelete.value);
    }
    closeConfirmation();
}
</script>

<template>
    <div class="card">
        <!-- блок с созданием учеников -->
        <div v-if="!showStudentTable">
            <div style="margin: 30px">
                <h1 class="font-semibold text-4xl mb-6">
                    Вы почти закончили с классом <span style="color: #0ea5e9">{{ currentClassName }}</span>
                </h1>
                <p class="font-semibold text-xl mb-4">Завершите создание, добавив учеников</p>
                <Button label="Добавить учеников" severity="info" icon="pi pi-plus" @click="addStudent" />
            </div>
            <Dialog :header="`Добавить учеников в ${currentClassName}`" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '60vw' }" :modal="true">
                <p class="leading-normal m-0 mb-4">Введите имена учащихся в поле ниже. Каждый ученик должен быть указан в новой строке (например: *Иван Иванов*).</p>
                <div class="form-container">
                    <!-- Первая колонка -->
                    <div class="form-column">
                        <Textarea rows="23" style="width: 100%" v-model="studentInput" placeholder="Введите имена и фамилии учеников..." @input="generatePreview" />
                    </div>

                    <!-- Вторая колонка - предпросмотр -->
                    <div class="form-column">
                        <p class="font-semibold text-xl mb-4" style="margin-left: auto; margin-right: auto; width: 10em; margin-top: 10em" v-if="!studentPreview.length">Предпросмотр пуст</p>
                        <table v-else class="preview-table">
                            <thead>
                                <tr>
                                    <th>№</th>
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
            <!-- последние проведенные тесты -->
            <div>
                <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--surface-border)">
                    <div class="font-semibold text-xl">Последние проведенные опросы</div>
                    <Button text severity="info" @click="goToSurveys(classId)">Смотреть все опросы</Button>
                </div>
                <!-- если нет недавних опросов -->
                <div v-if="recentSurveys.length === 0" class="font-semibold text-xl" style="margin: 20px; text-align: center">Недавние опросы отсутствуют</div>
                <!-- Список последних опросов -->
                <div v-else class="sections-list">
                    <div v-for="survey in recentSurveys" :key="survey.id" class="section-item" @click="goToSection(survey.id)">
                        <div class="survey-details">
                            <div class="survey-name">{{ survey.name }}</div>
                            <div class="survey-completion">Завершено: {{ survey.completion }}%</div>
                        </div>
                        <i class="pi pi-fw pi-angle-right" />
                    </div>
                </div>
            </div>

            <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Ученики</div>
            <div>
                <!-- Поле для быстрого добавления ученика -->
                <div class="flex gap-2 items-center" style="margin-bottom: 10px">
                    <InputText v-model="quickAddInput" placeholder="Быстрое добавление ученика" style="width: 40vh" />
                    <Button label="Добавить" icon="pi pi-plus" @click="quickAddStudent" class="p-button-info" />
                    <!-- Новая кнопка для массового добавления -->
                    <!-- <Button label="Добавить нескольких" icon="pi pi-users" @click="addManyStudents" class="p-button-info" /> -->
                </div>
                <!-- Кнопка добавления учеников -->
            </div>

            <!-- Таблица учеников -->
            <DataTable ref="dataTableRef" :value="students" :paginator="true" :rows="10" dataKey="id" :rowHover="true" :filters="filters" :globalFilterFields="['firstName', 'lastName']" showGridlines>
                <template #header>
                    <div class="flex justify-between items-center">
                        <!-- Поле для поиска -->
                        <div class="flex items-center gap-2">
                            <i class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Поиск по имени или фамилии" style="width: 40vh" />
                        </div>
                    </div>
                </template>

                <template #empty>Список учеников пуст</template>
                <Column field="id" header="Номер карточки" style="width: 10%; text-align: center" />
                <Column field="firstName" header="Имя" />
                <Column field="lastName" header="Фамилия" />
                <!-- Последняя колонка с кнопкой -->
                <Column style="width: 5%">
                    <!-- <template #body="slotProps">
                        <Button icon="pi pi-trash" @click="deletetudent(slotProps.data.id)" -->
                    <template #body="slotProps">
                        <Button icon="pi pi-trash" @click="confirmDeletion(slotProps.data.id)" class="p-button-outlined p-button-info" />
                        <Dialog header="Предупреждение" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
                            <div class="flex items-center justify-center">
                                <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
                                <span>Вы действительно хотите удалить данные об этом ученике?</span>
                            </div>
                            <template #footer>
                                <Button label="Нет" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
                                <Button label="Да" icon="pi pi-check" @click="proceedWithDeletion" severity="danger" outlined autofocus />
                            </template>
                        </Dialog>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.sections-list {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Две колонки */
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
