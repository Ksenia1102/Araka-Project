<script>
import QuizLayout from '@/layout/QuizLayout.vue';

export default {
    components: {
        QuizLayout
    },
    data() {
        return {
            quizTitle: 'Тестирование',
            classId: null,
            surveyId: null
        };
    },
    created() {
        // Получаем параметры из маршрута
        this.classId = this.$route.params.classId;
        this.surveyId = this.$route.params.surveyId;

        // Выводим их для проверки
    },
    methods: {
        goBack() {
            this.$router.push('/pages/dashboard');
        }
    }
};
</script>

<template>
    <QuizLayout :classId="classId" :surveyId="surveyId" @goBack="goBack"> </QuizLayout>
</template>

<style scoped></style>
