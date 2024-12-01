<script setup>
import SurveyMenu from './SurveyMenu.vue';

defineProps({
    questions: Array,
    selectedQuestionIndex: Number
});

const emit = defineEmits(['selectQuestion', 'addQuestion', 'copyQuestion', 'deleteQuestion']);
</script>

<template>
    <div class="sidebar">
        <!-- <h2>Вопросы</h2> -->
        <survey-menu :questions="questions" :selectedQuestionIndex="selectedQuestionIndex" @selectQuestion="emit('selectQuestion', $event)" @copyQuestion="emit('copyQuestion', $event)" @deleteQuestion="emit('deleteQuestion', $event)" />
        <Button @click="$emit('addQuestion')" icon="pi pi-plus" label="Добавить вопрос" severity="info" style="width: 100%"></Button>
    </div>
</template>

<style scoped>
.sidebar {
    width: 20rem;
    height: calc(100vh - 8rem);
    z-index: 999;
    overflow-y: auto;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    top: 6rem;
    left: 2rem;
    transition:
        transform var(--layout-section-transition-duration),
        left var(--layout-section-transition-duration);
    background-color: var(--surface-overlay);
    border-radius: var(--content-border-radius);
    margin: 30px 3.5rem;
    padding: 0 1.5rem;
}

.question-item {
    cursor: pointer;
    padding: 5px;
}

.icon-btn {
    margin-left: 5px;
    cursor: pointer;
}

.selected {
    font-weight: bold;
    color: #0ea5e9;
}
</style>
