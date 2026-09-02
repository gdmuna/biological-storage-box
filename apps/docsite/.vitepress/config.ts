import { defineConfig } from 'vitepress';
import { tasklist } from '@mdit/plugin-tasklist';

// const localeToOgLocaleMap: Record<string, string> = {
//     root: 'zh_CN',
//     en: 'en_US',
// };

export default defineConfig({
    title: 'TalosArk',
    description: '生物样本储存管理系统',
    lang: 'zh-Hans',

    // 内容来源指向 service 的 docs/ 文件夹
    srcDir: './docs',
    // 构建输出到 website/dist
    outDir: './dist',
    // 缓存目录
    cacheDir: './.vitepress/cache',

    // 排除内部规范文件，避免 rewrites 后产生重复路由
    srcExclude: ['**/STANDARD.md', '**/AGENTS.md', 'README.md'],

    // 忽略所有 localhost 链接造成的死链
    ignoreDeadLinks: [/^https?:\/\/localhost/],

    base: process.env.VITE_BASE_PATH ?? '/',

    lastUpdated: true,
    cleanUrls: true,
    metaChunk: true,

    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/img/gdmuna-logo_gradient-cut.png' }],
    ],

    rewrites: {
        '00-getting-started/:page': 'guide/:page',
        '01-guides/:page': 'guide/:page',
        '02-harness/:page': 'reference/:page',
        '03-architecture/:page': 'reference/:page',
        '04-appendix/:page': 'guide/:page',
        '05-releases/:page': 'guide/:page',
    },

    themeConfig: {
        logo: '/img/gdmuna-logo_gradient-cut.png',
        nav: [
            { text: '首页', link: '/' },
            { text: '上手', link: '/guide/introduction', activeMatch: '/guide/' },
            {
                text: '深入',
                link: '/reference/overview',
                activeMatch: '/reference/',
            },
            {
                text: 'API 参考文档',
                // 本地开发默认指向 backend dev server；Dockerfile 构建时通过 ARG VITE_API_REFERENCE_URL 覆盖
                link: process.env.VITE_API_REFERENCE_URL ?? 'http://localhost:3000/reference',
                target: '_blank',
            },
        ],

        sidebar: {
            '/guide/': [
                {
                    text: '概览',
                    items: [
                        { text: '项目简介', link: '/guide/introduction' },
                        { text: '核心理念', link: '/guide/philosophy' },
                        { text: '快速开始', link: '/guide/quick-start' },
                    ],
                },
                {
                    text: '指南',
                    items: [
                        { text: '环境搭建', link: '/guide/environment-setup' },
                        { text: '开发工作流', link: '/guide/development-workflow' },
                        { text: '测试指南', link: '/guide/testing' },
                        { text: 'Docker 与部署', link: '/guide/docker-deployment' },
                        { text: '贡献指南', link: '/guide/contributing' },
                    ],
                },
                {
                    text: '附录',
                    items: [
                        { text: '参考资源', link: '/guide/external-resources' },
                        { text: '错误码参考', link: '/guide/error-reference' },
                        { text: '更新日志', link: '/guide/CHANGELOG' },
                        { text: '关于本项目', link: '/guide/about' },
                        { text: '深入 →', link: '/reference/overview' },
                    ],
                },
                {
                    text: '发布说明',
                    collapsed: true,
                    items: [
                        { text: 'v0.7.4', link: '/guide/pr-0.7.4' },
                        { text: 'v0.7.3', link: '/guide/pr-0.7.3' },
                        { text: 'v0.7.2', link: '/guide/pr-0.7.2' },
                        { text: 'v0.7.1', link: '/guide/pr-0.7.1' },
                        { text: 'v0.7.0', link: '/guide/pr-0.7.0' },
                    ],
                },
            ],
            '/reference/': [
                {
                    text: 'Harness Engineering',
                    items: [
                        { text: '什么是 Harness Engineering', link: '/reference/overview' },
                        { text: '前置控制：引导层', link: '/reference/feedforward' },
                        { text: '反馈控制：感知层', link: '/reference/feedback' },
                    ],
                },
                {
                    text: '架构设计',
                    items: [
                        {
                            text: '项目架构全览',
                            link: '/reference/project-architecture-overview',
                        },
                        { text: '认证模块', link: '/reference/auth-module' },
                        { text: '请求生命周期', link: '/reference/request-pipeline' },
                        { text: '数据库', link: '/reference/database' },
                        { text: '异常系统', link: '/reference/exception-system' },
                        { text: '可观测性', link: '/reference/observability' },
                        { text: 'OpenAPI 增强', link: '/reference/openapi-enrichment' },
                        { text: '路由装饰器', link: '/reference/route-decorator' },
                        { text: 'CI/CD 部署', link: '/reference/cicd-deployment' },
                    ],
                },
                { text: '← 上手', link: '/guide/introduction' },
            ],
        },
        // 内置本地全文搜索
        search: {
            provider: 'local',
            options: {
                locales: {
                    root: {
                        translations: {
                            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换',
                                    closeText: '关闭',
                                },
                            },
                        },
                    },
                    en: {
                        translations: {
                            button: { buttonText: 'Search docs', buttonAriaLabel: 'Search docs' },
                            modal: {
                                noResultsText: 'No results found',
                                resetButtonTitle: 'Clear query',
                                footer: {
                                    selectText: 'Select',
                                    navigateText: 'Navigate',
                                    closeText: 'Close',
                                },
                            },
                        },
                    },
                },
            },
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/gdmuna/TalosArk' }],

        footer: {
            message:
                '基于 <a href="https://github.com/gdmuna/TalosArk/blob/dev/LICENSE">AGPL-3.0 许可</a> 发布',
            copyright: `版权所有 © 2024-至今 <a href="https://github.com/gdmuna">GDMU-NA & GDMU-ACM</a>`,
        },

        editLink: {
            pattern: 'https://github.com/gdmuna/TalosArk/edit/dev/docs/:path',
            text: '在 GitHub 上编辑此页',
        },

        lastUpdated: {
            text: '最后更新于',
        },

        outline: {
            label: '页面导航',
        },

        docFooter: {
            prev: '上一页',
            next: '下一页',
        },

        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '回到顶部',

        i18nRouting: true,
    },

    vite: {
        server: {
            port: Number(process.env.VITE_API_DOCS_PORT || 5173),
        },
        ssr: {
            // vitepress-mermaid-renderer 包含浏览器 API，SSR 时不打包
            noExternal: ['vitepress-mermaid-renderer'],
        },
    },

    markdown: {
        math: true,
        config: (md) => {
            const fence = md.renderer.rules.fence!;
            md.renderer.rules.fence = function (tokens, idx, options, env, self) {
                const { localeIndex = 'root' } = env;
                const codeCopyButtonTitle = (() => {
                    switch (localeIndex) {
                        case 'en':
                            return 'Copy code';
                        default:
                            return '复制代码';
                    }
                })();
                return fence(tokens, idx, options, env, self).replace(
                    '<button title="复制代码" class="copy"></button>',
                    `<button title="${codeCopyButtonTitle}" class="copy"></button>`
                );
            };
            // 渲染 GitHub 风格的 task list（- [ ] / - [x]）
            md.use(tasklist);
        },
    },

    locales: {
        root: { label: '简体中文', lang: 'zh-Hans', dir: 'ltr' },
        en: { label: 'English', lang: 'en-US', dir: 'ltr' },
    },
});
