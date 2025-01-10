<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

// Получение параметров маршрута и данных из query
const route = useRoute();
const className = route.query.className || 'Класс не указан';

// Получаем опросы (surveys) из query
const surveys = ref([]);
if (route.query.surveys) {
    try {
        surveys.value = JSON.parse(route.query.surveys);
    } catch (error) {
        console.error('Ошибка при разборе данных опросов:', error);
    }
}

// Получаем surveyId из параметров маршрута
const surveyId = route.params.surveyId;

// Находим текущий опрос по surveyId
const currentSurvey = computed(() => {
    return surveys.value.find((survey) => survey.id === parseInt(surveyId));
});

// Парсим список студентов из query
const students = ref([]);
if (route.query.students) {
    try {
        students.value = JSON.parse(route.query.students);
    } catch (error) {
        console.error('Ошибка при разборе данных студентов:', error);
    }
}

// Количество вопросов в опросе
const questionCount = 26;

// Генерация фейковых ответов
const surveyResults = computed(() => {
    return students.value.map((student) => {
        const answers = Array.from({ length: questionCount }, () => {
            const options = ['А', 'Б', 'В', 'Г'];
            const correctOption = options[Math.floor(Math.random() * options.length)];
            const studentAnswer = options[Math.floor(Math.random() * options.length)];
            const isCorrect = studentAnswer === correctOption;

            return { studentAnswer, correctOption, isCorrect };
        });

        const correctAnswersCount = answers.filter((a) => a.isCorrect).length;
        const completionRate = Math.round((correctAnswersCount / questionCount) * 100) + '%';

        return {
            fullName: `${student.firstName} ${student.lastName}`,
            answers,
            completionRate
        };
    });
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

            <Column v-for="(question, index) in questionCount" :key="index" :header="`Вопрос ${index + 1}`" style="min-width: 8rem">
                <template #body="slotProps">
                    <span
                        :style="{
                            display: 'inline-block',
                            padding: '0.2rem 0.7rem',
                            borderRadius: '4px',
                            color: 'white',
                            textAlign: 'center',
                            width: '100%',
                            backgroundColor: slotProps.data.answers[index].isCorrect ? 'var(--p-primary-color)' : '#F44336'
                        }"
                    >
                        {{ slotProps.data.answers[index].studentAnswer }}
                    </span>
                </template>
            </Column>

            <Column field="completionRate" header="Итог по тесту" style="min-width: 9rem; text-align: center" />
        </DataTable>
    </div>
</template>

<style scoped></style>
