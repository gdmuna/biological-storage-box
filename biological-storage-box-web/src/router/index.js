import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: '',
        redirect: '/auth/login'
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import('@/pages/demo/demo.vue'),
        meta: {
            title: '示例页面',
            showNavBar: true
        }
    },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/pages/auth/login.vue'),
        meta: {
            title: '用户登录'
        }
    },
    {
        path: '/box',
        name: 'box-manage',
        component: () => import('@/pages/box/manage.vue'),
        meta: {
            title: '试剂盒管理',
            showNavBar: true
        }
    },
    {
        path: '/box/create',
        name: 'box-create',
        component: () => import('@/pages/box/create.vue'),
        meta: {
            title: '试剂盒创建'
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
