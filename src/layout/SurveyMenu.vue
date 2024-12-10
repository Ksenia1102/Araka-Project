<script setup>
//import { ref } from 'vue';
//import SurveyMenuItem from './SurveyMenuItem.vue';
import { computed, ref } from 'vue';

const isHovered = ref(null);
const selectedQuestionIndex = ref(null); // Индекс выбранного вопроса

function selectQuestion(index) {
    selectedQuestionIndex.value = index; // Устанавливаем выбранный вопрос
    emit('selectQuestion', index); // Уведомляем родителя о выборе
}

const props = defineProps({
    questions: {
        type: Array,
        required: true
    },
    selectedQuestionIndex: {
        type: Number,
        default: null
    }
});

const emit = defineEmits(['selectQuestion', 'addQuestion', 'copyQuestion', 'deleteQuestion']);

const MAX_QUESTION_LENGTH = 10; // Максимальная длина текста в списке

const model = computed(() => {
    return [
        {
            label: 'Вопросы',
            items: props.questions.map((question, index) => ({
                label: `${index + 1}. ${truncateText(question.text)}`, // Обрезанный текст
                command: () => emit('selectQuestion', index),
                actions: [
                    {
                        // label: 'Скопировать',
                        icon: 'pi pi-copy',
                        command: () => emit('copyQuestion', index)
                    },
                    {
                        //label: 'Удалить',
                        icon: 'pi pi-trash',
                        command: () => emit('deleteQuestion', index)
                    }
                ]
            }))
        }
    ];
});

// Функция для обрезания текста
function truncateText(text) {
    return text.length > MAX_QUESTION_LENGTH ? text.slice(0, MAX_QUESTION_LENGTH) + '...' : text;
}
</script>

<template>
    <ul class="layout-menu" style="background-color: var(--surface-overlay); border-radius: var(--content-border-radius); padding: 0.5rem; margin: 1rem 0">
        <template v-for="(item, i) in model" :key="i">
            <!-- Заголовок категории -->
            <li v-if="item.label" class="layout-menu-category font-semibold text-xl mb-4">{{ item.label }}</li>

            <!-- Вопросы -->
            <template v-for="(subItem, j) in item.items" :key="j">
                <li class="layout-menuitem" :class="{ 'active-menuitem': isHovered === j, 'selected-question': selectedQuestionIndex === j }" @mouseenter="isHovered = j" @mouseleave="isHovered = null">
                    <!-- Основной текст вопроса -->
                    <div class="layout-menuitem-link" @click="selectQuestion(j)">
                        <span class="layout-menuitem-text">{{ subItem.label }}</span>
                    </div>

                    <!-- Действия (удалить/копировать) -->
                    <div class="layout-menuitem-actions">
                        <Button severity="info" v-for="(action, k) in subItem.actions" :key="k" :icon="action.icon" class="p-button-rounded p-button-text p-ml-2" @click="action.command" />
                    </div>
                </li>
            </template>
        </template>
    </ul>
</template>
<style scoped>
.layout-menuitem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    margin: 5px 0;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        color: #0ea5e9;
        background-color: var(--surface-hover); /* Цвет при наведении */
    }

    &.active-menuitem {
        background-color: var(--surface-hover);
    }

    &.selected-question {
        color: #0ea5e9;
        font-weight: bold;
        background-color: #d9f0ff; /* Голубой цвет для выбранного вопроса */
    }
}

.layout-menuitem-link {
    display: flex;
    align-items: center;
    flex-grow: 1;
}

.layout-menuitem-text {
    flex-grow: 1;
}

.layout-menuitem-actions {
    display: flex;
    gap: 0.5rem;
}
</style>
