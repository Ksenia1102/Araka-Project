<!-- SurveySidebar.vue -->
<script>
export default {
    props: {
        questions: Array,
        selectedQuestionIndex: Number
    }
};
</script>

<template>
    <div class="sidebar">
        <h2>Вопросы</h2>
        <ul>
            <li v-for="(question, index) in questions" :key="index" :class="{ selected: index === selectedQuestionIndex }">
                <button @click="$emit('selectQuestion', index)">{{ index + 1 }}. {{ question.text }}</button>
                <!-- Кнопка копирования вопроса -->
                <button @click="$emit('copyQuestion', index)" class="icon-btn">
                    📄
                    <!-- Иконка копирования -->
                </button>
                <!-- Кнопка удаления вопроса -->
                <button @click="$emit('deleteQuestion', index)" class="icon-btn">
                    🗑️
                    <!-- Иконка удаления -->
                </button>
            </li>
        </ul>
        <button @click="$emit('addQuestion')" class="add-btn">+ добавить вопрос</button>
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
    margin: 30px;
    padding: 1.5rem 1.5rem;
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
    color: blue;
}
</style>
