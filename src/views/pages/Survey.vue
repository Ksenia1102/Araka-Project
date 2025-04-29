<script>
import SurveyLayout from '@/layout/SurveyLayout.vue';

export default {
    components: {
        SurveyLayout
    },
    data() {
        return {
            surveyTitle: '',
            questions: [],
            currentQuestionIndex: null
        };
    },
    computed: {
        currentQuestion() {
            if (this.currentQuestionIndex !== null && this.questions[this.currentQuestionIndex]) {
                const question = this.questions[this.currentQuestionIndex];
                return {
                    ...question,
                    indexedText: `${this.currentQuestionIndex + 1}. ${question.text || ''}`
                };
            }
            return null;
        }
    },
    methods: {
        goBack() {
            this.$router.push('/pages/dashboard');
        },
        selectQuestion(index) {
            this.currentQuestionIndex = index;
        },
        addQuestion() {
            const newQuestion = {
                text: 'Новый вопрос',
                options: ['', '', '', ''],
                selectedOption: null,
                mediaUrl: null, // Теперь универсально: медиафайл
                mediaType: null, // Тип медиа (image, video, audio)
                mediaName: '',
                mediaSize: 0
            };
            this.questions.push(newQuestion);
            this.selectQuestion(this.questions.length - 1);
        },
        copyQuestion(index) {
            const questionToCopy = this.questions[index];

            const baseText = questionToCopy.text.replace(/\s*\(Копия\s*\d*\)$/, '');

            let copyNumber = 1;
            this.questions.forEach((q) => {
                const match = q.text.match(new RegExp(`^${baseText} \\(Копия (\\d+)\\)$`));
                if (match) {
                    copyNumber = Math.max(copyNumber, parseInt(match[1]) + 1);
                }
            });
            const copiedQuestion = {
                text: `${baseText} (Копия ${copyNumber})`,
                options: [...questionToCopy.options],
                selectedOption: questionToCopy.selectedOption,
                mediaUrl: questionToCopy.mediaUrl,
                mediaType: questionToCopy.mediaType,
                mediaName: questionToCopy.mediaName,
                mediaSize: questionToCopy.mediaSize
            };

            this.questions.push(copiedQuestion);
            this.selectQuestion(this.questions.length - 1);
        },
        deleteQuestion(index) {
            this.questions.splice(index, 1);
            if (this.questions.length === 0) {
                this.currentQuestionIndex = null;
                this.addQuestion();
            } else {
                this.currentQuestionIndex = Math.min(index, this.questions.length - 1);
            }
        },
        selectOption(index) {
            if (this.currentQuestion) {
                this.questions[this.currentQuestionIndex].selectedOption = index;
            }
        },
        triggerFileInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        handleFileUpload(event) {
            const file = event.target.files[0];
            const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

            if (file) {
                if (file.size > MAX_SIZE) {
                    alert('Файл слишком большой. Максимальный размер: 10 МБ.');
                    this.$refs.fileInput.value = ''; // Очистить input
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    if (this.currentQuestion) {
                        this.questions[this.currentQuestionIndex].mediaUrl = reader.result;
                        this.questions[this.currentQuestionIndex].mediaName = file.name;
                        this.questions[this.currentQuestionIndex].mediaSize = (file.size / 1024).toFixed(2);
                        const fileType = file.type.split('/')[0]; // тип файла
                        this.questions[this.currentQuestionIndex].mediaType = fileType;
                    }
                    this.$refs.fileInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        },
        removeMedia() {
            if (this.currentQuestion) {
                this.questions[this.currentQuestionIndex].mediaUrl = null;
                this.questions[this.currentQuestionIndex].mediaType = null;
                this.questions[this.currentQuestionIndex].mediaName = null;
                this.questions[this.currentQuestionIndex].mediaSize = null;
            }
            this.$refs.fileInput.value = '';
        }
    },
    mounted() {
        if (this.questions.length === 0) {
            this.addQuestion();
        }
    }
};
</script>

<template>
    <SurveyLayout :title="surveyTitle" :questions="questions" :currentQuestionIndex="currentQuestionIndex" @goBack="goBack" @selectQuestion="selectQuestion" @addQuestion="addQuestion" @copyQuestion="copyQuestion" @deleteQuestion="deleteQuestion">
        <div v-if="currentQuestion" class="card" style="min-height: 80vh">
            <div class="flex items-center">
                <span class="question-number">{{ currentQuestionIndex + 1 }}</span>
                <input v-maxlength="200" v-model="questions[currentQuestionIndex].text" placeholder="Введите текст вопроса" class="question-input" />
            </div>

            <!-- Медиа -->
            <div class="image-container" v-if="!currentQuestion.mediaUrl">
                <Button @click="triggerFileInput" icon="pi pi-upload" severity="info" class="btn-add-image" outlined />
                <input ref="fileInput" type="file" @change="handleFileUpload" accept="image/*,video/*,audio/*" style="display: none" />
            </div>

            <div v-if="currentQuestion.mediaUrl" class="image-container">
                <div class="image-preview">
                    <Button class="delete-btn" @click="removeMedia" icon="pi pi-times" severity="danger" rounded />

                    <template v-if="currentQuestion.mediaType === 'image'">
                        <img :src="currentQuestion.mediaUrl" alt="Загруженное изображение" class="uploaded-image" />
                    </template>

                    <template v-else-if="currentQuestion.mediaType === 'video'">
                        <video :src="currentQuestion.mediaUrl" controls class="uploaded-image"></video>
                    </template>

                    <template v-else-if="currentQuestion.mediaType === 'audio'">
                        <audio :src="currentQuestion.mediaUrl" controls class="uploaded-image"></audio>
                    </template>
                </div>
            </div>

            <!-- Варианты ответов -->
            <ul>
                <li v-for="(option, index) in currentQuestion.options" :key="index" :class="{ selected: currentQuestion.selectedOption === index }" @click="selectOption(index)" class="option">
                    <span class="option-label">{{ ['А', 'Б', 'В', 'Г'][index] }}.</span>
                    <input v-maxlength="200" v-model="currentQuestion.options[index]" placeholder="Введите текст ответа" class="option-input" />
                </li>
            </ul>
        </div>
    </SurveyLayout>
</template>

<style scoped>
.question-display {
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
}

.option {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    margin: 10px;
}

.option-label {
    margin-right: 10px;
    font-weight: bold;
}

.option-input {
    border: none;
    outline: none;
    background-color: #f9f9f9;
    width: 100%;
    padding: 5px;
}

.option.selected {
    border: 1px solid var(--p-primary-color);
    border-radius: 8px;
}

.question-input {
    width: 100%;
    padding: 8px;
    font-size: 18px;
    margin-bottom: 15px;
    background-color: #f9f9f9;
}
.question-number {
    padding: 8px 16px;
    font-size: 20px;
    margin-bottom: 15px;
    margin-right: 15px;
    font-weight: bold;
    color: white;
    background-color: #0ea5e9;
    border-radius: 3px;
}
.question-input:focus {
    border-color: none !important;
    outline: none !important;
}

.image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 30vh;
}

/* Контейнер изображения */
.image-preview {
    position: relative;
    width: 60%;
    max-width: 600px;
    /* overflow: hidden; */
    display: flex;
    justify-content: center;
    align-items: center;
}
.image-preview img,
.image-preview video {
    width: 100%;
    height: 40vh;
    object-fit: contain; /* Сохранение пропорций, вписывание в контейнер */
    border-radius: 4px;
    border: 0.5px solid #e9e9e9;
}
/* Для аудио */
.image-preview audio {
    width: 100%;
    height: 10vh;
    border: none;
}

.btn-add-image {
    width: 100%;
    height: 30vh;
    border: dashed 2px #0ea5e9;
    border-radius: 4px;
    cursor: pointer;
}

.btn-add-image :deep(.pi) {
    font-size: 2.5rem;
}

.delete-btn {
    position: absolute;
    top: -5px;
    right: -20px;
}
</style>
