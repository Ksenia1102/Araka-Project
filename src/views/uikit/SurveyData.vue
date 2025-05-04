<script setup>
import { ProductService } from '@/service/ProductService';
import axios from 'axios';
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

function getMediaType(url) {
    if (!url) return null;
    const extension = url.split('.').pop().toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (['mp4', 'webm', 'mov'].includes(extension)) return 'video';

    return null;
}

// Функция загрузки классов
const fetchClasses = async () => {
    try {
        const token = localStorage.getItem('authToken'); // Получаем токен авторизации
        const response = await axios.get(`${apiUrl}/api/classes/user/my`, {
            headers: {
                Authorization: `Bearer ${token}` // Стандартный формат
            }
        });
        classes.value = response.data; // Загружаем данные в `ref`
    } catch (error) {
        console.error('Ошибка при загрузке классов:', error);
    }
};

const copySurvey = async () => {
    try {
        const surveyId = route.params.id;

        // Получаем токен аутентификации
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Требуется авторизация. Пожалуйста, войдите.');
            router.push({ name: 'login' });
            return;
        }

        // Отправляем POST запрос на сервер для копирования опроса
        const response = await axios.post(
            `${apiUrl}/api/surveys/${surveyId}/copy`,
            {}, // Пустое тело запроса
            {
                headers: {
                    Authorization: `Bearer ${token}` // Стандартный формат, как в delete
                }
            }
        );
    } catch (error) {
        console.error('Детали ошибки:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        if (error.response?.status === 401) {
            alert('Сессия истекла. Пожалуйста, войдите заново.');
            this.$router.push({ name: 'login' });
        } else if (error.response?.status === 500) {
            alert(`Ошибка сервера: ${error.response.data?.error || 'Попробуйте позже'}`);
        } else {
            alert(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
        }
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
                Authorization: `Bearer ${token}` // Стандартный формат
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
        const surveyId = route.params.id;
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/surveys/${surveyId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: {
                // Добавляем timestamp для избежания кеширования
                t: Date.now()
            }
        });

        if (response.status !== 200) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const surveyData = response.data;

        // Проверяем структуру ответа
        if (!surveyData || !surveyData.title || !surveyData.questions) {
            throw new Error('Неверный формат данных опроса');
        }

        // Сохраняем данные
        surveyName.value = surveyData.title;
        lastModified.value = surveyData.createdAt;
        questions.value = surveyData.questions;
        console.log(surveyData.questions);
        // Форматируем дату
        formattedDate.value = new Date(surveyData.createdAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // errorMessage.value = 'Не удалось загрузить данные опроса';
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
                                            <div class="text-lg font-medium mt-2">{{ item.text }}</div>

                                            <!-- Если есть изображение, то показываем его -->
                                            <!-- <div class="p-fileupload-file-list">
                                                <div class="demo-image">
                                                    <img :src="mediaPreviewImage" width="50" />
                                                    <div style="margin-left: 10px">
                                                        <p>{{ mediaName || 'Нет медиа' }}</p>
                                                        <span>{{ mediaSize || '0 КБ' }}</span>
                                                    </div>
                                                </div>
                                            </div> -->
                                            <div v-if="item.file_url" class="flex items-center mt-2">
                                                <template v-if="getMediaType(item.file_url) === 'image'">
                                                    <img :src="item.file_url" alt="Изображение вопроса" style="max-width: 150px; max-height: 150px; border-radius: 8px" />
                                                </template>

                                                <template v-else-if="getMediaType(item.file_url) === 'audio'">
                                                    <img src="/demo/images/audio.png" alt="Аудио файл" style="width: 100px; height: auto" />
                                                </template>

                                                <template v-else-if="getMediaType(item.file_url) === 'video'">
                                                    <img src="/demo/images/video.png" alt="Видео файл" style="width: 100px; height: auto" />
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col md:items-end gap-8">
                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                            <!-- Для каждого варианта ответа выводим кнопку -->
                                            <Button v-for="(option, optionIndex) in item.options" :key="option.option_id" :outlined="true" :severity="optionIndex === item.correct_option_id ? 'success' : 'secondary'">
                                                {{ option.text }}
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
.demo-image {
    display: flex;
    align-items: center;
}
</style>
