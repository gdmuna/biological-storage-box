import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LoginPage from '@/pages/auth/LoginPage.vue';
import EmailLoginPage from '@/pages/auth/EmailLoginPage.vue';
import RegisterPage from '@/pages/auth/RegisterPage.vue';
import NewLayout from '@/layouts/newLayout.vue';
import DashboardPage from '@/pages/dashboard/DashboardPage.vue';
import BoxListPage from '@/pages/box/BoxListPage.vue';
import BoxCreatePage from '@/pages/box/BoxCreatePage.vue';
import BoxDetailPage from '@/pages/box/BoxDetailPage.vue';
import OrgManagePage from '@/pages/org/OrgManagePage.vue';
import RoomListPage from '@/pages/room/RoomListPage.vue';
import RoomDetailPage from '@/pages/room/RoomDetailPage.vue';
import NodePage from '@/pages/node/NodePage.vue';
import ProfilePage from '@/pages/user/ProfilePage.vue';
import ReagentPage from '@/pages/reagent/ReagentPage.vue';

const routes = [
    {
        path: '/login',
        component: LoginPage,
        meta: { public: true },
    },
    {
        path: '/login/email',
        component: EmailLoginPage,
        meta: { public: true },
    },
    {
        path: '/register',
        component: RegisterPage,
        meta: { public: true },
    },
    {
        path: '/',
        component: NewLayout,
        children: [
            { path: '', redirect: '/dashboard' },
            {
                path: 'dashboard',
                component: DashboardPage,
            },
            {
                path: 'box',
                component: BoxListPage,
            },
            {
                path: 'box/new',
                component: BoxCreatePage,
            },
            {
                path: 'box/:id',
                component: BoxDetailPage,
            },
            {
                path: 'org',
                component: OrgManagePage,
            },
            {
                path: 'room',
                component: RoomListPage,
            },
            {
                path: 'room/:id',
                component: RoomDetailPage,
            },
            {
                path: 'node',
                component: NodePage,
            },
            {
                path: 'user',
                component: ProfilePage,
            },
            {
                path: 'reagent',
                component: ReagentPage,
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
