import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LoginPage from '@/pages/auth/LoginPage.vue';
import EmailLoginPage from '@/pages/auth/EmailLoginPage.vue';
import RegisterPage from '@/pages/auth/RegisterPage.vue';
import AppLayout from '@/layouts/AppLayout.vue';
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
import ReagentTypePage from '@/pages/reagent-type/ReagentTypePage.vue';
import LogsPage from '@/pages/logs/LogsPage.vue';
import OrgDetailPage from '@/pages/org/OrgDetailPage.vue';

// ── RouteMeta 类型扩展 ─────────────────────────────────────
declare module 'vue-router' {
    interface RouteMeta {
        /** 浏览器标签页标题 */
        webTitle?: string;
        /** 面包屑显示文本 */
        breadcrumbLabel?: string;
        /** 是否为公开路由（不需要登录） */
        public?: boolean;
    }
}

const routes = [
    {
        path: '/login',
        component: LoginPage,
        meta: { public: true, webTitle: 'BSB | 登录', breadcrumbLabel: '登录' },
    },
    {
        path: '/login/email',
        component: EmailLoginPage,
        meta: { public: true, webTitle: 'BSB | 邮箱登录', breadcrumbLabel: '邮箱登录' },
    },
    {
        path: '/register',
        component: RegisterPage,
        meta: { public: true, webTitle: 'BSB | 注册', breadcrumbLabel: '注册' },
    },
    {
        path: '/',
        component: AppLayout,
        children: [
            { path: '', redirect: '/dashboard' },
            {
                path: 'dashboard',
                component: DashboardPage,
                meta: {
                    webTitle: 'BSB | 仪表盘',
                    breadcrumbLabel: '仪表盘',
                },
            },
            {
                path: 'box',
                component: BoxListPage,
                meta: {
                    webTitle: 'BSB | 储存盒',
                    breadcrumbLabel: '储存盒',
                },
            },
            {
                path: 'box/new',
                component: BoxCreatePage,
                meta: {
                    webTitle: 'BSB | 新建储存盒',
                    breadcrumbLabel: '新建储存盒',
                },
            },
            {
                path: 'box/:id',
                component: BoxDetailPage,
                meta: {
                    webTitle: 'BSB | 储存盒详情',
                    breadcrumbLabel: '储存盒详情',
                },
            },
            {
                path: 'org',
                component: OrgManagePage,
                meta: {
                    webTitle: 'BSB | 组织管理',
                    breadcrumbLabel: '组织管理',
                },
                children: [
                    {
                        path: ':id',
                        component: OrgDetailPage,
                        meta: { webTitle: 'BSB | 组织详情', breadcrumbLabel: '组织详情' },
                    },
                ],
            },
            {
                path: 'room',
                component: RoomListPage,
                meta: {
                    webTitle: 'BSB | 库室',
                    breadcrumbLabel: '库室',
                },
            },
            {
                path: 'room/:id',
                component: RoomDetailPage,
                meta: {
                    webTitle: 'BSB | 库室详情',
                    breadcrumbLabel: '库室详情',
                },
            },
            {
                path: 'node',
                component: NodePage,
                meta: {
                    webTitle: 'BSB | 节点图',
                    breadcrumbLabel: '节点图',
                },
            },
            {
                path: 'user',
                component: ProfilePage,
                meta: {
                    webTitle: 'BSB | 个人中心',
                    breadcrumbLabel: '个人中心',
                },
            },
            {
                path: 'reagent',
                component: ReagentPage,
                meta: {
                    webTitle: 'BSB | 试剂管理',
                    breadcrumbLabel: '试剂管理',
                },
            },
            {
                path: 'reagent-type',
                component: ReagentTypePage,
                meta: {
                    webTitle: 'BSB | 试剂类型',
                    breadcrumbLabel: '试剂类型',
                },
            },
            {
                path: 'logs',
                component: LogsPage,
                meta: {
                    webTitle: 'BSB | 操作日志',
                    breadcrumbLabel: '操作日志',
                },
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

// 同步浏览器标签页标题
router.afterEach((to) => {
    document.title = to.meta.webTitle ?? 'Biological Storage Box';
});

export default router;
