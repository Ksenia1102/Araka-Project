<script>
import SurveySidebar from './SurveySidebar.vue';
import SurveyTopbar from './SurveyTopbar.vue';

export default {
    components: {
        SurveyTopbar,
        SurveySidebar
    },
    props: {
        // Убедитесь, что передаем эти пропсы
        questions: Array,
        surveyTitle: String // Заголовок опроса
    },
    data() {
        return {
            localSurveyTitle: this.surveyTitle // Локальная копия заголовка опроса
        };
    },
    methods: {
        updateSurveyTitle(newTitle) {
            this.localSurveyTitle = newTitle; // Обновляем локальное название опроса
        },
        saveSurvey() {
            console.log('Опрос сохранен с названием:', this.localSurveyTitle);

            // Отправляем событие saveSurvey с заголовком и вопросами в родительский компонент
            this.$emit('saveSurvey', {
                title: this.localSurveyTitle
            });
        },
        goBack() {
            console.log('Нажата кнопка "Назад"');
            this.$router.push('/pages/dashboard');
            // Логика для возвращения на предыдущую страницу
        },
        selectQuestion(index) {
            console.log('Выбран вопрос:', index);
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
        <SurveyTopbar :title="surveyTitle" @update:title="updateSurveyTitle" @saveSurvey="saveSurvey" />
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
