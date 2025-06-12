<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const classId = route.params.classId;
const currentClassName = ref(route.query.className || ''); // Получаем из query, если есть
console.log('currentClassName', currentClassName.value);

const surveys = ref([]);
if (route.query.surveys) {
    try {
        surveys.value = JSON.parse(route.query.surveys);
    } catch (error) {
        console.error('Ошибка при разборе данных тестов:', error);
    }
}

const groupedSurveys = computed(() => {
    const grouped = {};
    surveys.value.forEach((survey) => {
        if (!grouped[survey.month]) {
            grouped[survey.month] = [];
        }
        grouped[survey.month].push(survey);
    });
    return grouped;
});

function goToSection(className, survey) {
    router.push({
        name: 'chart-sur',
        params: {
            classId: classId,
            surveyId: survey.id
        },
        query: {
            className: className,
            surveys: JSON.stringify(surveys.value)
        }
    });
}
</script>

<template>
    <div class="card">
        <div class="flex" style="gap: 0.5rem; align-items: stretch">
            <i class="pi pi-users" style="font-size: 2.3rem"></i>
            <h2 class="font-semibold text-4xl mb-6">Класс {{ currentClassName }}</h2>
        </div>
        <div>
            <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--surface-border)">
                <div class="font-semibold text-xl">Пройденные классом тесты</div>
            </div>

            <div class="font-semibold text-xl" style="margin: 20px; text-align: center" v-if="Object.keys(groupedSurveys).length === 0">Тесты пока не проводились</div>

            <div v-else>
                <div v-for="(surveyList, month) in groupedSurveys" :key="month" class="month-section">
                    <h3 class="month-header">{{ month }}</h3>
                    <div class="sec-list">
                        <div v-for="survey in surveyList" :key="survey.id" class="sec-item" @click="goToSection(currentClassName, survey)">
                            <div class="survey-details">
                                <div class="survey-name">{{ survey.name }}</div>
                                <div class="survey-completion">Пройден на: {{ survey.completion }}%</div>
                            </div>
                            <i class="pi pi-fw pi-angle-right" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
