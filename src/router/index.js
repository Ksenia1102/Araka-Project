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
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/working',
                    name: 'working',
                    component: () => import('@/views/uikit/Working.vue')
                },
                {
                    path: '/uikit/sur-data/:id',
                    name: 'sur-data',
                    component: () => import('@/views/uikit/SurveyData.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
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
