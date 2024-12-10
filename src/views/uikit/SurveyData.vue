<script setup>
import { ProductService } from '@/service/ProductService';
import { computed, onMounted, ref } from 'vue';

const products = ref(null);
const picklistProducts = ref(null);
const orderlistProducts = ref(null);
const options = ref(['list', 'grid']);
const layout = ref('list');

onMounted(() => {
    ProductService.getProductsSmall().then((data) => {
        products.value = data.slice(0, 6);
        picklistProducts.value = [data, []];
        orderlistProducts.value = data;
    });
});

// Список классов
const classes = ref([
    { id: 1, name: '1А', studentsCount: 25 },
    { id: 2, name: '1Б', studentsCount: 20 },
    { id: 3, name: '2А', studentsCount: 23 },
    { id: 4, name: '2Б', studentsCount: 22 }
]);

// Выбранный класс
const selectedClass = ref(null);

// Функция для выбора класса
function selectClass(classId) {
    selectedClass.value = classId;
}

// Название выбранного класса
const selectedClassName = computed(() => {
    const selected = classes.value.find((classItem) => classItem.id === selectedClass.value);
    return selected ? selected.name : 'Не выбран';
});

const displayConfirmation = ref(false);

const displaySur = ref(false);

function openConfirmation() {
    displayConfirmation.value = true;
}
function openSurvey() {
    displaySur.value = true;
}

function closeConfirmation() {
    displayConfirmation.value = false;
}
function startSur() {
    displaySur.value = false;
    openQuiz();
}
function openQuiz() {
    window.open('/uikit/quiz', '_blank');
}
</script>
<script>
export default {
    methods: {
        openNewTab() {
            window.open('/pages/survey', '_blank');
        }
    }
};
</script>

<template>
    <div className="card">
        <div class="flex" style="flex-direction: column">
            <h2 class="font-semibold text-4xl mb-6">Опрос 1</h2>
            <h3 style="margin-bottom: 1em">Изменено 16 окт. 2023 г.</h3>
        </div>

        <div class="card flex flex-col gap-4 w-full" style="padding: initial">
            <Toolbar>
                <template #start>
                    <Button label="Запустить" severity="info" icon="pi pi-caret-right" text @click="openSurvey" />
                    <Button label="Редактировать" :to="{ name: 'survey' }" @click="openNewTab" icon="pi pi-file-edit" severity="secondary" text />
                    <Button label="Копировать опрос" icon="pi pi-clone" severity="secondary" text />
                    <Dialog header="Выберите класс, в котором будет запущен опрос Опрос 1" v-model:visible="displaySur" :style="{ width: '350px' }" :modal="true">
                        <div v-if="selectedClass">
                            <p>Выбранный класс: {{ selectedClassName }}</p>
                        </div>
                        <div>
                            <div class="border-t">
                                <ul style="margin: 10px">
                                    <li v-for="classItem in classes" :key="classItem.id" :class="{ selected: selectedClass === classItem.id }" @click="selectClass(classItem.id)" style="cursor: pointer; margin: 10px">
                                        {{ classItem.name }} (Ученики: {{ classItem.studentsCount }})
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <template #footer>
                            <Button label="Начать опрос" @click="startSur" :to="{ name: 'quiz' }" text severity="info" />
                        </template>
                    </Dialog>
                </template>

                <template #end>
                    <Button label="Удалить" icon="pi pi-trash" severity="secondary" style="width: auto" @click="openConfirmation" text />
                    <Dialog header="Предупреждение" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
                        <div class="flex items-center justify-center">
                            <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
                            <span>Вы действительно хотите удалить опрос?</span>
                        </div>
                        <template #footer>
                            <Button label="Нет" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
                            <Button label="Да" icon="pi pi-check" @click="closeConfirmation" severity="danger" outlined autofocus />
                        </template>
                    </Dialog>
                </template>
            </Toolbar>

            <DataView :value="products" :layout="layout">
                <template #header>
                    <div class="flex space-between">
                        <div class="font-semibold text-xl">Список вопросов</div>
                        <SelectButton v-model="layout" :options="options" :allowEmpty="false">
                            <template #option="{ option }">
                                <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
                            </template>
                        </SelectButton>
                    </div>
                </template>

                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div v-for="(item, index) in slotProps.items" :key="index">
                            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{ 'border-t border-surface': index !== 0 }">
                                <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                    <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                        <div>
                                            <div class="text-lg font-medium mt-2">Где находится ухо у кузнечика?</div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col md:items-end gap-8">
                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                            <Button outlined severity="secondary">A</Button>
                                            <Button outlined severity="secondary">Б</Button>
                                            <Button outlined severity="secondary">В</Button>
                                            <Button outlined severity="info">Г</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template #grid="slotProps">
                    <div class="grid grid-cols-12 gap-4">
                        <div v-for="(item, index) in slotProps.items" :key="index" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                            <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col">
                                <div class="pt-6">
                                    <div class="flex flex-row justify-between items-start gap-2">
                                        <div>
                                            <!-- <div class="text-lg font-medium mt-1">{{ item.name }}</div> -->
                                            <div class="text-lg font-medium mt-1">Где находится ухо у кузнечика?</div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-6 mt-6">
                                        <div class="flex gap-2" style="flex-direction: row">
                                            <Button outlined>A</Button>
                                            <Button outlined>A</Button>
                                            <Button outlined>A</Button>
                                            <Button outlined>A</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </div>
    </div>
</template>

<style scoped>
.selected {
    font-weight: bold;
    color: #0ea5e9;
}
</style>
