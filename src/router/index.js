import AppLayout from '@/layout/AppLayout.vue';
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
                {
                    path: '/pages/survey',
                    name: 'survey',
                    component: () => import('@/views/pages/Survey.vue')
                },
                {
                    path: '/pages/test',
                    name: 'test',
                    component: () => import('@/views/pages/Test.vue')
                },
                {
                    path: '/uikit/class/:classId',
                    name: 'class',
                    component: () => import('@/views/uikit/Class.vue'),
                    props: true
                },
                {
                    path: '/uikit/chart-sur',
                    name: 'chart-sur',
                    component: () => import('@/views/uikit/ChartSur.vue'),
                    props: true
                },
                {
                    path: '/uikit/working',
                    name: 'working',
                    component: () => import('@/views/uikit/Working.vue')
                },
                {
                    path: '/uikit/sur-data',
                    name: 'sur-data',
                    component: () => import('@/views/uikit/SurveyData.vue')
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
            path: '/pages/quiz',
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
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
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
        }
    ]
});

// Добавляем глобальный навигационный хук для проверки авторизации
router.beforeEach((to, from, next) => {
    const isAuthenticated = false; // Здесь добавьте логику для проверки, авторизован ли пользователь

    if (to.matched.some((record) => record.meta.requiresAuth) && !isAuthenticated) {
        // Если маршрут требует авторизации и пользователь не авторизован
        next({ name: 'login' }); // Перенаправляем на страницу логина
    } else {
        // Если авторизация не требуется или пользователь авторизован
        next(); // Продолжаем переход
    }
});

export default router;
