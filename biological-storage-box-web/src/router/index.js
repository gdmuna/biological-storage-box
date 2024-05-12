import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: '',
        redirect: '/demo'
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import('@/pages/demo/demo.vue')
    },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/pages/auth/login.vue')
    },
    {
        path: '/box/manage',
        name: 'box-manage',
        component: () => import('@/pages/box/manage.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
