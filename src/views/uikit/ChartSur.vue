<script setup>
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
const apiUrl = import.meta.env.VITE_API_URL;

const route = useRoute();
const className = route.query.className || 'Класс не указан';
const classId = route.params.classId;
const surveyId = route.params.surveyId;
console.log(surveyId);
const questionIds = ref([]);

// Данные тестов из query
const surveys = ref([]);
if (route.query.surveys) {
    try {
        surveys.value = JSON.parse(route.query.surveys);
    } catch (error) {
        console.error('Ошибка при разборе данных тестов:', error);
    }
}

console.log('surveys', route.query);

const currentSurvey = computed(() => {
    return surveys.value.find((survey) => survey.id === parseInt(surveyId));
});

// Храним полученные результаты
const surveyResults = ref([]);
// const questionCount = 26;

// Запрос данных с сервера
onMounted(async () => {
    try {
        const token = localStorage.getItem('authToken');

        const response = await axios.get(`${apiUrl}/api/conducting/${classId}/${surveyId}/results`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = response.data;
        console.log('data', data);

        const grouped = {};
        const questionIdSet = new Set();

        for (const record of data) {
            const studentId = record.student.id;
            questionIdSet.add(record.takenQuestion.question_id); // собираем id вопросов

            if (!grouped[studentId]) {
                grouped[studentId] = {
                    fullName: record.student?.name || 'Имя не указано',
                    answers: {}
                };
            }

            // Сохраняем ответ в виде словаря: { [questionId]: ответ }
            grouped[studentId].answers[record.takenQuestion.question_id] = {
                studentAnswer: record.answer,
                isCorrect: record.isCorrect
            };
        }

        // Сохраняем отсортированные id вопросов
        questionIds.value = Array.from(questionIdSet).sort((a, b) => a - b);

        // Вычисляем результаты
        surveyResults.value = Object.values(grouped).map((student) => {
            const correctCount = Object.values(student.answers).filter((a) => a.isCorrect).length;
            return {
                ...student,
                answers: student.answers, // словарь
                completionRate: Math.round((correctCount / questionIds.value.length) * 100) + '%'
            };
        });
    } catch (err) {
        console.error('Ошибка загрузки результатов теста:', err);
    }
});

const displayDownloadDialog = ref(false);
const selectedTestName = ref(null);

const gradingSystem = ref(['percent']); // Массив выбранных систем оценивания
const gradingSystemError = ref('');

const openDownloadDialog = (testName) => {
    selectedTestName.value = testName;
    displayDownloadDialog.value = true;
};

const fileDownload = (blobData, fileName) => {
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const closeDownloadDialog = () => {
    displayDownloadDialog.value = false;
};

const validateBeforeDownload = (format) => {
    if (gradingSystem.value.length === 0) {
        gradingSystemError.value = 'Выберите хотя бы одну систему оценивания';
        return;
    }
    gradingSystemError.value = '';
    downloadReport(format, gradingSystem.value);
};

const downloadReport = async (format, systems) => {
    console.log(`Скачивание отчета в формате ${format} по тесту ${selectedTestName.value}`);
    console.log('Выбранные системы оценивания:', systems);

    try {
        const token = localStorage.getItem('authToken');
        const systemsParam = systems.join(',');

        const response = await axios.get(`${apiUrl}/api/conducting/${classId}/${surveyId}/report`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                format: format, // pdf или excel
                gradingSystems: systemsParam
            },
            responseType: 'blob' // Важно для получения файла
        });

        // Скачиваем файл
        const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
        const fileName = `report_${selectedTestName.value || surveyId}.${fileExtension}`;
        fileDownload(response.data, fileName);

        displayDownloadDialog.value = false;
    } catch (error) {
        console.error('Ошибка при скачивании отчёта:', error);
    }
};
</script>
<template>
    <div class="card">
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-users" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Класс {{ className }}</h2>
        </div>

        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Результаты: {{ currentSurvey.name }} - {{ currentSurvey.completion }}%</div>
        <Button label="Скачать отчёт" icon="pi pi-download" severity="info" @click="openDownloadDialog(currentSurvey.name)" class="p-button-outlined mb-4" />
        <!-- Диалог скачивания отчета -->
        <Dialog v-model:visible="displayDownloadDialog" :style="{ width: '500px' }" :modal="true">
            <template #header>
                <h1 style="font-size: 17px; font-weight: 600">
                    Скачать отчёт по тесту <b>«{{ currentSurvey.name }}»</b>
                </h1>
            </template>
            <!-- Поле выбора системы оценивания -->
            <div class="flex flex-col gap-2 mb-8">
                <label class="font-medium">Выберите систему оценивания:</label>
                <div class="flex flex-col gap-3">
                    <div class="flex align-items-center">
                        <Checkbox inputId="percent" v-model="gradingSystem" value="percent" :binary="false" />
                        <label for="percent" class="ml-2">В процентах, %</label>
                    </div>
                    <div class="flex align-items-center">
                        <Checkbox inputId="five-point" v-model="gradingSystem" value="five-point" :binary="false" />
                        <label for="five-point" class="ml-2">5-ти бальная</label>
                    </div>
                </div>
                <small v-if="gradingSystemError" class="p-error text-red-500">{{ gradingSystemError }}</small>
            </div>
            <div class="flex flex-col items-center justify-center gap-4">
                <label class="font-medium">Выберите формат отчёта</label>
                <div class="flex gap-3 mt-1">
                    <Button label="PDF на печать" icon="pi pi-file-pdf" @click="validateBeforeDownload('pdf')" severity="info" class="custom-pdf-button" />
                    <Button label="Excel" icon="pi pi-file-excel" @click="validateBeforeDownload('excel')" severity="info" class="custom-excel-button" />
                </div>
            </div>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" @click="closeDownloadDialog" text severity="secondary" />
            </template>
        </Dialog>
        <DataTable :value="surveyResults" :paginator="true" :rows="10" showGridlines>
            <template #header>
                <div class="flex justify-between items-center">
                    <!-- <Button type="button" icon="pi pi-filter-slash" label="Очистить фильтр" severity="info" outlined @click="clearFilter()" /> -->
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText placeholder="Поиск" />
                    </IconField>
                </div>
            </template>
            <template #empty>Нет данных для отображения</template>

            <Column field="fullName" header="Ученик" style="min-width: 15rem" />

            <Column v-for="(questionId, index) in questionIds" :key="questionId" :header="`Вопрос ${index + 1}`" style="min-width: 8rem">
                <template #body="slotProps">
                    <span
                        :style="{
                            display: 'inline-block',
                            padding: '0.2rem 0.7rem',
                            borderRadius: '4px',
                            color: 'white',
                            textAlign: 'center',
                            width: '100%',
                            backgroundColor: slotProps.data.answers[questionId].isCorrect ? 'var(--p-primary-color)' : '#F44336'
                        }"
                    >
                        {{ slotProps.data.answers[questionId].studentAnswer }}
                    </span>
                </template>
            </Column>

            <Column field="completionRate" header="Итог по тесту" style="min-width: 9rem; text-align: center" />
        </DataTable>
    </div>
</template>

<style scoped>
.custom-pdf-button {
    background: #b30b00 !important;
    border-color: #b30b00 !important;
    color: white !important;
}

.custom-pdf-button:hover {
    background: #8a0900 !important;
    border-color: #8a0900 !important;
}

.custom-pdf-button:active {
    background: #600600 !important;
    border-color: #600600 !important;
}

.custom-excel-button {
    background: #217346 !important;
    border-color: #217346 !important;
    color: white !important;
}

.custom-excel-button:hover {
    background: #1a5c38 !important;
    border-color: #1a5c38 !important;
}

.custom-excel-button:active {
    background: #13452a !important;
    border-color: #13452a !important;
}
</style>
