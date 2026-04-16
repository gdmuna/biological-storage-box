/** @type {import('jest').Config} */
export default {
    // ===== 基础配置 =====

    // 预设：使用 ts-jest 处理 TypeScript
    preset: 'ts-jest',

    // 测试环境：Node.js
    testEnvironment: 'node',

    // ===== 测试文件配置 =====

    // 测试文件搜索根目录
    roots: ['<rootDir>/src', '<rootDir>/test'],

    // 测试文件匹配模式
    testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],

    // 模块扩展名解析顺序
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],

    // 路径别名映射(与 tsconfig.json 中的 paths 对应)
    moduleNameMapper: {
        '^@/(.*?)(?:\\.js)?$': '<rootDir>/src/$1', // @/ 别名(可选 .js 后缀)
        '^@root/(.*?)(?:\\.js)?$': '<rootDir>/$1', // @/ 别名(可选 .js 后缀)
        '^(\\.{1,2}/.*)\\.js$': '$1', // ESM: 相对路径 .js 映射到 .ts
    },

    // ===== ts-jest 配置 =====

    transform: {
        '^.+\\.tsx?$': [
            // 匹配 .ts 和 .tsx 文件
            'ts-jest',
            {
                useESM: true, // ESM 模式
                tsconfig: {
                    module: 'ESNext',
                    moduleResolution: 'nodenext',
                    target: 'ESNext',
                },
            },
        ],
    },

    // ===== 覆盖率配置 =====

    // 启用覆盖率收集
    collectCoverage: true,

    // 覆盖率报告输出目录
    coverageDirectory: '<rootDir>/coverage',

    coverageReporters: process.env.CI === 'true' ? ['lcov', 'text'] : ['text'],

    // 收集覆盖率的文件模式
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.spec.ts', // 排除测试文件
        '!src/**/*.e2e-spec.ts', // 排除 e2e 测试文件
        '!src/main.ts', // 排除入口文件
        // '!src/app.controller.ts', // 排除 app.controller
        // '!src/app.service.ts', // 排除 app.service
        // '!src/app.module.ts', // 排除 app.module
    ],

    // 覆盖率阈值
    // coverageThreshold: {
    //     global: {
    //         statements: 50, // 语句覆盖率
    //         branches: 50, // 分支覆盖率
    //         functions: 50, // 函数覆盖率
    //         lines: 50, // 行覆盖率
    //     },
    // },
};
