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

// Данные опросов из query
const surveys = ref([]);
if (route.query.surveys) {
    try {
        surveys.value = JSON.parse(route.query.surveys);
    } catch (error) {
        console.error('Ошибка при разборе данных опросов:', error);
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
        console.error('Ошибка загрузки результатов опроса:', err);
    }
});
</script>
<template>
    <div class="card">
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-users" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Класс {{ className }}</h2>
        </div>

        <div class="font-semibold text-xl mb-4" style="border-bottom: 1px solid var(--surface-border)">Результаты: {{ currentSurvey.name }} - {{ currentSurvey.completion }}%</div>

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

<style scoped></style>
