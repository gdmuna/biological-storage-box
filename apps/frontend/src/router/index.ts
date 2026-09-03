import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
    interface RouteMeta {
        /** 浏览器标签页标题 */
        defaultTitle?: string;
    }
}

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/workbench',
    },
    {
        path: '/workbench',
        component: () => import('@/components/layout/workbench/AppWorkbenchLayout.vue'),
        meta: {
            defaultTitle: 'workbench',
        },
        children: [
            {
                path: '',
                redirect: '/workbench/welcome',
            },
            {
                path: 'welcome',
                component: () => import('@/view/welcome/WorkbenchWelcome.vue'),
                meta: {
                    defaultTitle: 'welcome',
                },
            },
            {
                path: 'playground',
                component: () => import('@/view/playground/WorkbenchPlayground.vue'),
                meta: {
                    defaultTitle: 'playground',
                },
            },
            {
                path: 'overview',
                component: () => import('@/view/overview/WorkbenchOverview.vue'),
                meta: {
                    defaultTitle: 'overview',
                },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// router.beforeEach(async (to) => {
//     const auth = useAuthStore();
//     if (!auth.initialized) await auth.fetchMe();
//     if (!to.meta.public && !auth.isLoggedIn) return '/login';
// });

// 同步浏览器标签页标题
// router.afterEach((to) => {
//     document.title = to.meta.webTitle ?? 'Playground';
// });

export default router;
