import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import croppingText from './cropping-text';

import { definePreset } from '@primevue/themes';

const app = createApp(App);

// You can change the name 'sky' to any name you like, in my case it was just to keep the standard
const sky = definePreset(Aura, {
    semantic: {
        primary: {
            50: 'sky{.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '{sky.500}',
            600: '{sky.600}',
            700: '{sky.700}',
            800: '{sky.800}',
            900: '{sky.900}',
            950: '{sky.950}'
        }
    }
});

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: sky,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(croppingText);
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
