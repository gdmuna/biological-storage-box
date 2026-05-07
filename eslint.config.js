import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

// 各工作区共享的基础规则
const commonRules = {
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    'no-console': 'warn',
    'no-debugger': 'error',
};

export default [
    // ── 全局忽略 ──────────────────────────────────────────────
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            'BSB-Backend/prisma/generated/**',
            'BSB-Docsite/.vitepress/dist/**',
            'BSB-Docsite/.vitepress/cache/**',
        ],
    },

    // ── BSB-Backend: TypeScript ───────────
    {
        files: ['BSB-Backend/src/**/*.ts', 'BSB-Backend/test/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            globals: {
                ...globals.node,
                ...globals.es2024,
                ...globals.vitest,
                NodeJS: 'readonly',
            },
            parserOptions: {
                project: './BSB-Backend/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
                sourceType: 'module',
                // lint-staged 传入单文件时，允许不在 tsconfig include 内的文件
                allowDefaultProject: ['*.ts'],
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,
            ...commonRules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/explicit-function-return-types': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },

    // ── BSB-Frontend: Vue 3 + TypeScript ───────
    {
        files: ['BSB-Frontend/src/**/*.{js,ts,vue}'],
        ignores: ['BSB-Frontend/src/components/ui/**'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                extraFileExtensions: ['.vue'],
            },
            globals: {
                ...globals.browser,
                ...globals.es2024,
            },
        },
        plugins: {
            vue: vuePlugin,
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...vuePlugin.configs['vue3-recommended'].rules,
            ...commonRules,
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },

    // ── 关闭与 Prettier 冲突的格式规则（全局）────────────────
    prettierConfig,
];
