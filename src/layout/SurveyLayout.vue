<!-- SurveyLayout.vue -->
<script>
import SurveySidebar from './SurveySidebar.vue';
import SurveyTopbar from './SurveyTopbar.vue';

export default {
    components: {
        SurveyTopbar,
        SurveySidebar
    },
    props: {
        title: String,
        questions: Array
    },
    methods: {
        goBack() {
            this.$emit('goBack');
        },
        selectQuestion(index) {
            this.$emit('selectQuestion', index);
        },
        addQuestion() {
            this.$emit('addQuestion');
        },
        copyQuestion(index) {
            this.$emit('copyQuestion', index); // Добавляем метод для копирования вопроса
        },
        deleteQuestion(index) {
            this.$emit('deleteQuestion', index); // Добавляем метод для удаления вопроса
        }
    }
};
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <SurveyTopbar :title="title" @goBack="goBack" />
        <div class="content">
            <SurveySidebar :questions="questions" @selectQuestion="selectQuestion" @addQuestion="addQuestion" @copyQuestion="copyQuestion" @deleteQuestion="deleteQuestion" />
            <div class="main-content">
                <slot />
            </div>
        </div>
        <AppFooter></AppFooter>
    </div>
</template>

<style scoped>
.survey-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.content {
    display: flex;
    flex-grow: 1;
}

.main-content {
    flex-grow: 1;
    padding: 20px 20px 20px 0;
    margin: 10px 10px 10px 0;
}
.survey-title-input {
    font-size: 24px;
    font-weight: bold;
    border: none;
    outline: none;
    background: transparent;
    margin-bottom: 20px;
    width: 100%;
    padding: 5px;
}
</style>
