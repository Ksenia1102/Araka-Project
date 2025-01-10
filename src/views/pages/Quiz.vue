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
    <QuizLayout> </QuizLayout>
</template>

<style scoped></style>
