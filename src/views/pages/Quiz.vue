<!-- <script setup></script>
<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Опрос</div>
        <p>Здесь будет проигрыватся опрос</p>
    </div>
</template>
<style scoped>
.card {
    margin: 30px;
    height: auto;
}
</style> -->

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
        console.log('Класс ID:', this.classId);
        console.log('Опрос ID:', this.surveyId);
    },
    methods: {
        goBack() {
            console.log('выход');
            this.$router.push('/pages/dashboard');
        }
    }
};
</script>

<template>
    <QuizLayout :classId="classId" :surveyId="surveyId" @goBack="goBack">
        <!-- <div class="card" style="height: 80vh; max-width: 120vh">
            <div class="font-semibold text-xl mb-4">Опрос</div>
            <p>Здесь будет проигрыватся опрос</p>
        </div> -->
    </QuizLayout>
</template>

<style scoped>
/* При необходимости стили для страницы Quiz */
</style>
