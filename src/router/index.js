import AppLayout from '@/layout/AppLayout.vue';
import axios from 'axios';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/Home.vue')
        },

        {
            path: '/pages/dashboard',
            component: AppLayout,
            children: [
                {
                    path: '/pages/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/pages/Dashboard.vue')
                },
                // {
                //     path: '/pages/survey',
                //     name: 'survey',
                //     component: () => import('@/views/pages/Survey.vue')
                // },
                {
                    path: '/uikit/class/:classId/:title',
                    name: 'class',
                    component: () => import('@/views/uikit/Class.vue'),
                    props: true
                },
                {
                    // параметр
                    path: '/uikit/chart-sur/:surveyId',
                    name: 'chart-sur',
                    component: () => import('@/views/uikit/ChartSur.vue'),
                    props: true
                },
                {
                    path: '/uikit/sur-class/:classId',
                    name: 'sur-class',
                    component: () => import('@/views/uikit/SurClass.vue'),
                    props: true
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/Charts.vue')
                },
                {
                    path: '/uikit/sur-data/:id',
                    name: 'sur-data',
                    component: () => import('@/views/uikit/SurveyData.vue')
                },
                {
                    path: '/uikit/user',
                    name: 'user',
                    component: () => import('@/views/uikit/User.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/survey',
            name: 'survey',
            component: () => import('@/views/pages/Survey.vue')
        },
        {
            path: '/pages/modify_survey',
            name: 'modifySurvey',
            component: () => import('@/views/pages/Modify_Survey.vue'),
            props: true // Для передачи параметров маршрута
        },
        {
            path: '/pages/quiz/:classId/:surveyId',
            name: 'quiz',
            component: () => import('@/views/pages/Quiz.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/pages/empty',
            name: 'empty',
            component: () => import('@/views/pages/Empty.vue')
        },
        {
            path: '/auth/code',
            name: 'code',
            component: () => import('@/views/pages/auth/code.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/registration',
            name: 'registration',
            component: () => import('@/views/pages/auth/Registration.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        },
        {
            path: '/demo',
            name: 'demo',
            component: () => import('@/views/pages/Demo.vue'),
            meta: { requiresAuth: true }
        }
        // {
        //     path: '/auth/code',
        //     name: 'code',
        //     component: () => import('@/views/pages/auth/23.vue')
        // }
    ]
});

// Добавляем глобальный навигационный хук для проверки авторизации
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('authToken');
    const isAuthenticated = !!token;

    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            return next({ name: 'login' });
        }

        axios
            .get(`${import.meta.env.VITE_API_URL}/auth/validate-token`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
                console.log('демонстрация');
                next(); // токен валиден
            })
            .catch(() => {
                localStorage.removeItem('authToken');
                next({ name: 'login' }); // токен невалиден
            });
    } else {
        next(); // не требуется авторизация
    }
});

export default router;
