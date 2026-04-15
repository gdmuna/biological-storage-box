import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
    {
        path: '/login',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { public: true },
    },
    {
        path: '/login/email',
        component: () => import('@/pages/auth/EmailLoginPage.vue'),
        meta: { public: true },
    },
    {
        path: '/register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
        meta: { public: true },
    },
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        children: [
            { path: '', redirect: '/dashboard' },
            {
                path: 'dashboard',
                component: () => import('@/pages/dashboard/DashboardPage.vue'),
            },
            {
                path: 'box',
                component: () => import('@/pages/box/BoxListPage.vue'),
            },
            {
                path: 'box/new',
                component: () => import('@/pages/box/BoxCreatePage.vue'),
            },
            {
                path: 'box/:id',
                component: () => import('@/pages/box/BoxDetailPage.vue'),
            },
            {
                path: 'org',
                component: () => import('@/pages/org/OrgManagePage.vue'),
            },
            {
                path: 'node',
                component: () => import('@/pages/node/NodePage.vue'),
            },
            {
                path: 'user',
                component: () => import('@/pages/user/ProfilePage.vue'),
            },
            {
                path: 'reagent',
                component: () => import('@/pages/reagent/ReagentPage.vue'),
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to) => {
    const auth = useAuthStore();
    if (!auth.initialized) await auth.fetchMe();
    if (!to.meta.public && !auth.isLoggedIn) return '/login';
});

export default router;
