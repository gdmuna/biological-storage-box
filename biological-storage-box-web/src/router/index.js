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
        path: '/box/update',
        name: 'box-update',
        component: () => import('@/pages/box/update.vue'),
        meta: {
            title: '更改试剂盒信息'
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
        path: '/reagent/detail',
        name: 'reagent-detail',
        component: () => import('@/pages/reagent/detail.vue'),
        meta: {
            title: '试剂详情'
        }
    },
    {
        path: '/box/detail',
        name: 'box-detail',
        component: () => import('@/pages/box/detail.vue'),
        meta: {
            title: '试剂盒详情'
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
        path: '/grid',
        name: 'work',
        component: () => import('@/pages/work/work.vue'),
        meta: {
            title: '工作台',
            showNavBar: true
        }
    },
    {
        path: '/org/create',
        name: 'org-create',
        component: () => import('@/pages/org/create.vue'),
        meta: {
            title: '课题组创建'
        }
    },
    {
        path: '/search/search',
        name: 'search',
        component: () => import('@/pages/search/search.vue'),
        meta: {
            title: '搜索'
        }
    },
    {
        path: '/org/joinOrg',
        name: 'joinOrg',
        component: () => import('@/pages/org/joinOrg.vue'),
        meta: {
            title: '搜索加入组织'
        }
    },
    {
        path: '/org/applyReason',
        name: 'applyReason',
        component: () => import('@/pages/org/applyReason.vue'),
        meta: {
            title: '申请理由'
        }
    },
    {
        path: '/user/setting',
        name: 'setting',
        component: () => import('@/pages/user/setting.vue'),
        meta: {
            title: '设置'
        }
    },
    {
        path: '/user/feedback',
        name: 'feedback',
        component: () => import('@/pages/user/feedback.vue'),
        meta: {
            title: '意见反馈'
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
