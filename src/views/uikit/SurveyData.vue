<script setup>
import { ProductService } from '@/service/ProductService';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const apiUrl = import.meta.env.VITE_API_URL;
// const router = useRoute(); // Используем роутер для навигации
const router = useRouter();
const products = ref(null);
const picklistProducts = ref(null);
const orderlistProducts = ref(null);
// const options = ref(['list', 'grid']);
const layout = ref('list');
const route = useRoute();
const questions = ref([]); // Здесь будут храниться вопросы
const surveyId = route.params.id;
const surveyName = ref('');
const lastModified = ref('');
const formattedDate = ref('');
// Пример ID опроса. Можно заменить на динамическое значение.

function getUserID() {
    const token = localStorage.getItem('authToken'); // Извлекаем токен из localStorage
    if (!token) {
        console.error('Пользователь не авторизован');
        this.$router.push({ name: 'login' }); // Перенаправление на страницу входа
        return;
    }

    try {
        // Используем jwt-decode для извлечения данных из токена
        const decoded = jwtDecode(token);
        if (decoded && decoded.id) {
            return decoded.id; // Устанавливаем userId из токена
        } else {
            throw new Error('ID пользователя отсутствует в токене');
        }
    } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        this.$router.push({ name: 'login' }); // Перенаправление на страницу входа
    }

    if (this.questions.length === 0) {
        this.addQuestion();
    }
}

// Функция загрузки классов
const fetchClasses = async () => {
    try {
        const token = localStorage.getItem('authToken'); // Получаем токен авторизации
        const UserId1 = getUserID();
        const response = await axios.get(`${apiUrl}/api/classes/${UserId1}`, {
            headers: {
                token: token
            }
        });
        classes.value = response.data; // Загружаем данные в `ref`
    } catch (error) {
        console.error('Ошибка при загрузке классов:', error);
    }
};

const copySurvey = async () => {
    try {
        const token = localStorage.getItem('authToken'); // Получаем токен из localStorage
        const response = await axios.post(
            `${apiUrl}/api/surveys/${surveyId}/copy`,
            {},
            {
                headers: {
                    token: token // Отправляем токен авторизации
                }
            }
        );

        // После успешного копирования перенаправляем пользователя на страницу нового опроса
        const newSurvey = response.data;
        alert(`Опрос "${newSurvey.survey_name}" успешно скопирован!`);
        router.push({ name: 'dashboard' }); // Перенаправляем на страницу нового опроса
    } catch (error) {
        console.error('Ошибка при копировании опроса:', error);
        alert('Произошла ошибка при копировании опроса.');
    }
};

const deleteSurvey = async () => {
    try {
        // Получаем ID опроса из параметров маршрута
        const surveyId = route.params.id;

        // Отправляем DELETE запрос на сервер для удаления опроса
        const token = localStorage.getItem('authToken');
        await axios.delete(`${apiUrl}/api/surveys/${surveyId}`, {
            headers: {
                token: token // Токен авторизации
            }
        });

        // После успешного удаления, можно перенаправить на страницу с опросами
        // Например, на главную страницу опросов или перечень всех опросов
        // alert('Опрос успешно удален!');

        router
            .push({ name: 'dashboard' }) // Навигация по маршруту в ту же вкладку
            .then(() => {
                console.log('Перенаправление выполнено');
            })
            .catch((error) => {
                console.error('Ошибка при перенаправлении:', error);
            });
    } catch (error) {
        console.error('Ошибка при удалении опроса:', error);
        alert('Произошла ошибка при удалении опроса.');
    }
};

onMounted(async () => {
    try {
        fetchClasses();
        // Отправка GET запроса для получения данных о опросе
        // const surveyResponse = await axios.get('http://localhost:3000/api/questions/1'); // Здесь замените на нужный URL
        // surveyId.value = surveyResponse.data.id; // Предположим, что ответ содержит поле id опроса

        // Теперь отправляем запрос на получение вопросов для этого опроса
        const token = localStorage.getItem('authToken');

        const questionsResponse = await axios.get(`${apiUrl}/api/questions/${surveyId}`, {
            headers: {
                token: token // Добавляем токен в заголовки
            }
        });
        const data = questionsResponse.data;
        surveyName.value = data.survey_name; // Название опроса
        lastModified.value = data.survey_date; // Дата опроса
        questions.value = data.questions; // Список вопросов

        // Преобразуем строку в объект Date
        formattedDate.value = new Date(lastModified.value).toLocaleDateString('ru-RU', {
            // weekday: 'long', // День недели (например, понедельник)
            year: 'numeric', // Год
            month: 'long', // Месяц (например, ноябрь)
            day: 'numeric' // Число
        });
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
});

onMounted(() => {
    ProductService.getProductsSmall().then((data) => {
        products.value = data.slice(0, 6);
        picklistProducts.value = [data, []];
        orderlistProducts.value = data;
    });
});

const displayConfirmation = ref(false);

function openConfirmation() {
    displayConfirmation.value = true;
}

function closeConfirmation() {
    displayConfirmation.value = false;
}

// Список классов
const classes = ref([
    { id: 1, name: '1А', studentsCount: 25 },
    { id: 2, name: '1Б', studentsCount: 20 },
    { id: 3, name: '2А', studentsCount: 23 },
    { id: 4, name: '2Б', studentsCount: 22 }
]);
// Выбранный класс
const selectedClass = ref(null);
// Функция для выбора класса
function selectClass(classId) {
    selectedClass.value = classId;
}
// Название выбранного класса
const selectedClassName = computed(() => {
    const selected = classes.value.find((classItem) => classItem.id === selectedClass.value);
    return selected ? selected.title : 'Не выбран';
});

const displaySur = ref(false);
function openSurvey() {
    displaySur.value = true;
}

function startSur(classId) {
    if (!classId) {
        alert('Пожалуйста, выберите класс');
        return;
    }
    displaySur.value = false;
    openQuiz(classId);
}
function openQuiz(classId) {
    window.open(`/pages/quiz/${classId}/${surveyId}`, '_blank');
}
function openNewTab() {
    const newTabUrl = `/pages/modify_survey?id=${surveyId}`;
    router.push(newTabUrl);
}
</script>
<script></script>

<template>
    <div className="card">
        <div class="flex" style="flex-direction: column">
            <h2 class="font-semibold text-4xl mb-6">{{ surveyName }}</h2>
            <h3 style="margin-bottom: 1em">{{ formattedDate }}</h3>
        </div>

        <div class="card flex flex-col gap-4 w-full" style="padding: initial">
            <Toolbar>
                <template #start>
                    <Button label="Запустить" severity="info" icon="pi pi-caret-right" text @click="openSurvey" />
                    <Button label="Редактировать" @click="openNewTab" icon="pi pi-file-edit" severity="secondary" text />
                    <Button label="Копировать опрос" icon="pi pi-clone" severity="secondary" text @click="copySurvey" />
                    <Dialog header="Выберите класс, в котором будет запущен опрос" v-model:visible="displaySur" :style="{ width: '350px' }" :modal="true">
                        <div v-if="selectedClass">
                            <p>Выбранный класс: {{ selectedClassName }}</p>
                        </div>
                        <div>
                            <div class="border-t">
                                <ul style="margin: 10px">
                                    <li v-for="classItem in classes" :key="classItem.id" :class="{ selected: selectedClass === classItem.id }" @click="selectClass(classItem.id)" style="cursor: pointer; margin: 10px">
                                        {{ classItem.title }} (Ученики: {{ classItem.studentsCount }})
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <template #footer>
                            <Button label="Начать опрос" @click="startSur(selectedClass)" text severity="info" :disabled="!selectedClass" />
                        </template>
                    </Dialog>
                </template>

                <template #end>
                    <Button label="Удалить" icon="pi pi-trash" severity="secondary" style="width: auto" @click="openConfirmation" text />
                    <Dialog header="Предупреждение" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
                        <div class="flex items-center justify-center">
                            <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
                            <span>Вы действительно хотите удалить опрос?</span>
                        </div>
                        <template #footer>
                            <Button label="Нет" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
                            <Button label="Да" icon="pi pi-check" @click="deleteSurvey" severity="danger" outlined autofocus />
                        </template>
                    </Dialog>
                </template>
            </Toolbar>

            <DataView :value="products" :layout="layout">
                <template #header>
                    <div class="flex space-between">
                        <div class="font-semibold text-xl">Список вопросов</div>
                        <!-- <SelectButton v-model="layout" :options="options" :allowEmpty="false">
                            <template #option="{ option }">
                                <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
                            </template>
                        </SelectButton> -->
                    </div>
                </template>

                <template #list>
                    <div class="flex flex-col">
                        <div v-for="(item, index) in questions" :key="index">
                            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{ 'border-t border-surface': index !== 0 }">
                                <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                    <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                        <div>
                                            <!-- Выводим текст вопроса -->
                                            <div class="text-lg font-medium mt-2">{{ item.question_text }}</div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col md:items-end gap-8">
                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                            <!-- Для каждого варианта ответа выводим кнопку -->
                                            <Button v-for="(option, optionIndex) in item.options" :key="option.option_id" :outlined="true" :severity="optionIndex === item.correct_option_id ? 'success' : 'secondary'">
                                                {{ option.option_text }}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template #grid="slotProps">
                    <div class="grid grid-cols-12 gap-4">
                        <div v-for="(item, index) in questions" :key="index" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                            <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col">
                                <div class="pt-6">
                                    <div class="flex flex-row justify-between items-start gap-2">
                                        <div>
                                            <!-- Отображение текста вопроса -->
                                            <div class="text-lg font-medium mt-1">{{ item.question_text }}</div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-6 mt-6">
                                        <div class="flex gap-2" style="flex-direction: row">
                                            <!-- Кнопки для отображения вариантов ответа -->
                                            <Button v-for="(option, optionIndex) in item.options" :key="option.option_id" :outlined="true" :severity="optionIndex === item.correct_option_id ? 'success' : 'secondary'">
                                                {{ option.option_text }}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </div>
    </div>
</template>

<style scoped>
.selected {
    font-weight: bold;
    color: #0ea5e9;
}
</style>
