<!-- SurveyTopbar.vue -->
<script>
export default {
    props: {
        title: String
    },
    data() {
        return {
            localTitle: this.title // создаем локальную копию title
        };
    },
    watch: {
        // Следим за изменением пропа title и обновляем localTitle, если он изменится
        title(newTitle) {
            this.localTitle = newTitle;
        }
    },
    methods: {
        updateTitle() {
            // Отправляем событие в родительский компонент с новым значением
            this.$emit('update:title', this.localTitle);
        }
    }
};
</script>

<template>
    <div class="topbar">
        <Button @click="$emit('goBack')" icon="pi pi-chevron-left" class="back-btn" text severity="secondary"></Button>
        <div class="survey-title" style="width: -webkit-fill-available">
            <input v-model="localTitle" @input="updateTitle" placeholder="Название опроса" class="survey-title-input" />
        </div>
        <Button @click="$emit('goBack')" label="Сохранить" class="back-btn" text severity="info"></Button>
    </div>
</template>

<style scoped>
.topbar {
    height: 4rem;
    z-index: 997;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0 2rem;
    background-color: var(--surface-card);
    transition: left var(--layout-section-transition-duration);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.back-btn {
    font-size: 18px;
    cursor: pointer;
}
.survey-title-input {
    font-size: 24px;
    font-weight: bold;
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    padding: 5px;
    text-align: center;
}
</style>
