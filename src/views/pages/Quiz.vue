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
            quizTitle: 'Тестирование'
        };
    },
    methods: {
        goBack() {
            this.$router.push('/pages/dashboard');
        }
    }
};
</script>

<template>
    <QuizLayout>
        <!-- <div class="card" style="height: 80vh; max-width: 120vh">
            <div class="font-semibold text-xl mb-4">Опрос</div>
            <p>Здесь будет проигрыватся опрос</p>
        </div> -->
    </QuizLayout>
</template>

<style scoped>
/* При необходимости стили для страницы Quiz */
</style>
