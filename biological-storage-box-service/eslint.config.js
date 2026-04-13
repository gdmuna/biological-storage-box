import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import globals from 'globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
    {
        files: ['src/**/*.ts', 'test/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            globals: {
                ...globals.node,
                ...globals.es2024,
                ...globals.jest,
                NodeJS: 'readonly',
            },
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // JavaScript 基础规则
            ...eslint.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,

            // TypeScript 特定规则
            '@typescript-eslint/no-explicit-any': 'off', // 允许显式 any
            '@typescript-eslint/explicit-module-boundary-types': 'off', // 灵活

            // 风格规则
            'no-console': 'warn', // 生产环境应清理 console
            'no-debugger': 'error', // debugger 不能提交
            'prefer-const': 'error', // 优先 const
            'no-var': 'error', // 禁用 var
            eqeqeq: ['error', 'always'], // 使用 === 而非 ==
            // 'no-redeclare': 'off', // 允许变量重声明

            // 关闭过度的规则
            '@typescript-eslint/explicit-function-return-types': 'off', // 不强制函数返回类型
            '@typescript-eslint/no-floating-promises': 'off', // 允许未 await 的 Promise
            '@typescript-eslint/no-non-null-assertion': 'warn', // 允许非空断言但警告
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ], // 允许未使用的变量但警告
        },
    },
];
