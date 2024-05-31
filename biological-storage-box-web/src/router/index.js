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
    },
    {
        path: '/reagent',
        name: 'reagent-manage',
        component: () => import('@/pages/reagent/manage.vue'),
        meta: {
            title: '试剂管理'
        }
    },
    {
        path: '/reagent/operate',
        name: 'reagent-operate',
        component: () => import('@/pages/reagent/operate.vue'),
        meta: {
            title: '试剂操作'
        }
    },
    {
        path: '/reagent/log',
        name: 'reagent-log',
        component: () => import('@/pages/reagent/log.vue'),
        meta: {
            title: '日志'
        }
    },
    {
        path: '/user',
        name: 'user',
        component: () => import('@/pages/user/user.vue'),
        meta: {
            title: '我的',
            showNavBar: true
        }
    },
    {
        path: '/gird',
        name: 'work',
        component: () => import('@/pages/work/work.vue'),
        meta: {
            title: '工作台',
            showNavBar: true
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
