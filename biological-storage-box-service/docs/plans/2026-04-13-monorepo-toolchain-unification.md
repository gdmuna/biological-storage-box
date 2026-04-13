# Monorepo Toolchain Unification 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一 monorepo 三个工作区的 ESLint、Prettier、`.npmrc`、`.gitattributes` 配置，并修复 service Dockerfile 以支持 `pnpm deploy` 方式构建镜像。

**Architecture:** 将所有工具链配置集中到 monorepo 根目录，各包通过 pnpm `node-linker=hoisted` 共享依赖，ESLint 使用单个根级 flat config 按路径前缀路由规则，Prettier 使用 overrides 区分 Vue 文件规则，Docker 构建上下文上移至 monorepo 根并用 `pnpm deploy` 提取生产依赖。

**Tech Stack:** pnpm workspaces, ESLint v9 flat config, Prettier v3, husky v9, lint-staged v16, @typescript-eslint/eslint-plugin v8, eslint-plugin-vue v9

---

## 前置检查

运行前确认工作区干净：

```bash
git status --short
```

预期：无未暂存变更（或只有计划外的未跟踪文件）。

---

## Task 1: 清理冗余配置文件，统一 `.npmrc` / `.gitattributes` / `.nvmrc`

**Files:**
- Modify: `.npmrc`（根目录）
- Modify: `.gitattributes`（根目录）
- Create: `.nvmrc`（根目录）
- Delete: `biological-storage-box-web/.npmrc`
- Delete: `biological-storage-box-web/.gitattributes`
- Delete: `biological-storage-box-web/.nvmrc`
- Delete: `biological-storage-box-service/.npmrc`

**Step 1: 将 web 的镜像配置合入根 `.npmrc`**

当前根 `.npmrc` 内容：
```ini
auto-install-peers=true
engine-strict=true
node-linker=hoisted
```

`biological-storage-box-web/.npmrc` 额外有：
```ini
registry=https://registry.npmmirror.com/
disturl=https://npmmirror.com/mirrors/node/
sass-binary-site=https://npmmirror.com/mirrors/node-sass/
```

将以下三行追加到根 `.npmrc` 末尾（pnpm 会忽略 npm-only 的 `disturl`/`sass-binary-site`，但保留无害）：
```ini

# 镜像源（来自 web 包，统一提升至根）
registry=https://registry.npmmirror.com/
disturl=https://npmmirror.com/mirrors/node/
sass-binary-site=https://npmmirror.com/mirrors/node-sass/
```

**Step 2: 更新根 `.gitattributes`，加入 `safecrlf=true`**

修改根 `.gitattributes`，从：
```
* text=auto eol=lf
```
改为：
```
* text=auto eol=lf safecrlf=true
```

**Step 3: 在根目录创建 `.nvmrc`**

```
22
```

**Step 4: 删除各包冗余文件**

```bash
Remove-Item "biological-storage-box-web\.npmrc"
Remove-Item "biological-storage-box-web\.gitattributes"
Remove-Item "biological-storage-box-web\.nvmrc"
Remove-Item "biological-storage-box-service\.npmrc"
```

**Step 5: 验证 pnpm install 仍正常**

```bash
pnpm install --no-frozen-lockfile
```

预期：`Done in Xs`，无报错。

**Step 6: Commit**

```bash
git add .npmrc .gitattributes .nvmrc
git add biological-storage-box-web/.npmrc biological-storage-box-web/.gitattributes biological-storage-box-web/.nvmrc
git add biological-storage-box-service/.npmrc
git commit -m "chore: consolidate .npmrc/.gitattributes/.nvmrc to repo root

- merge web registry mirror config into root .npmrc
- remove service/.npmrc (duplicate of root)
- add safecrlf=true to root .gitattributes, remove web copy
- create root .nvmrc (node 22), remove outdated web copy (v18)"
```

---

## Task 2: 统一 Prettier 配置

**Files:**
- Modify: `.prettierrc.js`（根目录）
- Delete: `biological-storage-box-web/.prettierrc.cjs`

**关键差异说明：**

| 选项 | 根（service 基准） | web 现有 | 决策 |
|------|-------------------|---------|------|
| `printWidth` | 100 | 360 | 根保持 100，Vue overrides 用 360 |
| `trailingComma` | `es5` | `none` | 根保持 `es5`，Vue overrides 用 `none` |
| `quoteProps` | `as-needed` | `consistent` | 根保持 `as-needed` |
| `bracketSameLine` | 无 | `true` | 仅 Vue overrides 添加 |
| `htmlWhitespaceSensitivity` | 无 | `ignore` | 仅 Vue overrides 添加 |
| `vueIndentScriptAndStyle` | 无 | `false` | 仅 Vue overrides 添加 |

**Step 1: 更新根 `.prettierrc.js`**

将 `overrides` 数组替换为：

```js
overrides: [
    {
        files: '*.{yaml,yml,json}',
        options: {
            tabWidth: 2,
        },
    },
    {
        // Vue 文件使用宽松规则：长行不强制换行，模板风格优先
        files: '*.{vue,html}',
        options: {
            printWidth: 360,
            trailingComma: 'none',
            bracketSameLine: true,
            htmlWhitespaceSensitivity: 'ignore',
            vueIndentScriptAndStyle: false,
        },
    },
],
```

**Step 2: 删除 web 的独立 Prettier 配置**

```bash
Remove-Item "biological-storage-box-web\.prettierrc.cjs"
```

**Step 3: 验证格式化结果**

```bash
# 检查 service 文件不受影响
pnpm --filter biological-storage-box-service prettier src/main.ts --check

# 检查 web 文件使用新规则
pnpm --filter biological-storage-box-web prettier src/App.vue --check
```

如果有格式差异，运行 `pnpm run format` 统一格式化：
```bash
pnpm run format
```

**Step 4: Commit**

```bash
git add .prettierrc.js biological-storage-box-web/.prettierrc.cjs
git commit -m "style: unify Prettier config at repo root

- add Vue/HTML override: printWidth=360, trailingComma=none,
  bracketSameLine=true, htmlWhitespaceSensitivity=ignore
- remove biological-storage-box-web/.prettierrc.cjs"
```

---

## Task 3: 统一 ESLint 配置（根 flat config + 升级 web 到 ESLint v9）

**Files:**
- Create: `eslint.config.js`（根目录）
- Delete: `biological-storage-box-service/eslint.config.js`
- Delete: `biological-storage-box-web/.eslintrc.cjs`
- Modify: `package.json`（根目录）—— 添加 ESLint 相关 devDeps + lint script
- Modify: `biological-storage-box-service/package.json` —— 移除 ESLint devDeps（改由根提升）
- Modify: `biological-storage-box-web/package.json` —— 移除 ESLint devDeps + 升级 eslint-plugin-vue

**Step 1: 在根 `package.json` 添加 ESLint devDependencies 和 lint script**

`devDependencies` 新增（版本与 service 当前保持一致）：
```json
"@eslint/js": "^9.39.4",
"@typescript-eslint/eslint-plugin": "^8.58.1",
"@typescript-eslint/parser": "^8.58.1",
"eslint": "~9.39.4",
"eslint-config-prettier": "^9.1.0",
"eslint-plugin-vue": "^9.32.0",
"globals": "^16.0.0",
"vue-eslint-parser": "^9.4.3"
```

`scripts` 新增：
```json
"lint": "eslint ."
```

**Step 2: 安装新依赖**

```bash
pnpm install --no-frozen-lockfile
```

预期：新包安装成功，无报错。

**Step 3: 创建根 `eslint.config.js`**

```js
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
            'biological-storage-box-service/prisma/generated/**',
            'biological-storage-box-docs/.vitepress/dist/**',
            'biological-storage-box-docs/.vitepress/cache/**',
        ],
    },

    // ── biological-storage-box-service: TypeScript ───────────
    {
        files: [
            'biological-storage-box-service/src/**/*.ts',
            'biological-storage-box-service/test/**/*.ts',
        ],
        languageOptions: {
            parser: tsParser,
            globals: {
                ...globals.node,
                ...globals.es2024,
                ...globals.jest,
                NodeJS: 'readonly',
            },
            parserOptions: {
                project: './biological-storage-box-service/tsconfig.json',
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

    // ── biological-storage-box-web: Vue 3 + TypeScript ────────────────
    {
        files: ['biological-storage-box-web/src/**/*.{js,ts,vue}'],
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
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...vuePlugin.configs['vue3-recommended'].rules,
            ...commonRules,
        },
    },

    // ── 关闭与 Prettier 冲突的格式规则（全局）────────────────
    prettierConfig,
];
```

**Step 4: 删除各包的独立 ESLint 配置**

```bash
Remove-Item "biological-storage-box-service\eslint.config.js"
Remove-Item "biological-storage-box-web\.eslintrc.cjs"
```

**Step 5: 从 service package.json 移除 ESLint devDeps**

`biological-storage-box-service/package.json` 的 `devDependencies` 中移除：
```
@eslint/js
@typescript-eslint/eslint-plugin
@typescript-eslint/parser
eslint
globals
```
（这些现在由根 `node-linker=hoisted` 提升）

**Step 6: 从 web package.json 移除 ESLint devDeps**

`biological-storage-box-web/package.json` 的 `devDependencies` 中移除：
```
eslint
eslint-config-prettier
eslint-plugin-prettier
eslint-plugin-vue
vue-eslint-parser
```

**Step 7: 重新安装依赖**

```bash
pnpm install --no-frozen-lockfile
```

**Step 8: 验证根目录 lint 可以检查全部工作区**

```bash
pnpm run lint 2>&1 | Select-Object -Last 10
```

预期：ESLint 输出，无 `eslint.config.js` 未找到的报错，可能有规则警告（正常）。

**Step 9: 验证各包可以单独 lint**

```bash
pnpm --filter biological-storage-box-service run lint
pnpm --filter biological-storage-box-web run eslint
```

预期：各自只检查本包文件，无报错（有警告可忽略）。

**Step 10: Commit**

```bash
git add eslint.config.js package.json pnpm-lock.yaml
git add biological-storage-box-service/eslint.config.js biological-storage-box-service/package.json
git add biological-storage-box-web/.eslintrc.cjs biological-storage-box-web/package.json
git commit -m "refactor: unify ESLint config at repo root (flat config)

- create root eslint.config.js with service (TypeScript) and web (Vue3) rules
- migrate web from .eslintrc.cjs (ESLint v8 legacy) to flat config
- hoist eslint devDeps to root, remove per-package duplicates
- add allowDefaultProject for lint-staged single-file compatibility
- add root lint script: eslint ."
```

---

## Task 4: 更新 lint-staged 配置和 pre-commit hook

**Files:**
- Modify: `package.json`（根目录）—— lint-staged
- Modify: `.husky/pre-commit`

**Step 1: 更新根 `package.json` 的 `lint-staged`**

将 lint-staged 从单条目改为按工作区分别 lint：

```json
"lint-staged": {
    "biological-storage-box-service/**/*.{js,ts}": [
        "eslint --fix",
        "prettier --write"
    ],
    "biological-storage-box-web/**/*.{js,ts,vue}": [
        "eslint --fix",
        "prettier --write"
    ],
    "**/*.{json,yaml,yml,css,scss,html}": [
        "prettier --write"
    ]
}
```

**Step 2: 更新 `.husky/pre-commit`**

将当前 hook 中的 lint 逻辑替换（lint 已由 lint-staged 处理，hook 只保留测试触发）：

```sh
#!/bin/sh

GREEN="\033[32m"; YELLOW="\033[33m"; RESET="\033[0m"

printf "%-12b  %b\n" "\n${GREEN}[GitHook]" "[LOG] 执行 Pre-commit hook...${RESET}"

# 记录已暂存的 env 文件（排除 .env.keys 和 .env.example）
staged_env_files=$(git diff --cached --name-only -- ':.env.*' ':!.env.keys' ':!.env.example')

if [ -n "$staged_env_files" ]; then
    pnpm --filter biological-storage-box-service dotenvx encrypt -f $staged_env_files
    git add $staged_env_files
fi

if git diff --cached --quiet; then
    printf "%-12b  %b\n" "${YELLOW}[GitHook]" "[WARN] 无暂存文件，跳出 Pre-commit hooks${RESET}"
    exit 0
fi

# lint-staged: 格式化 + ESLint（自动按工作区路径路由规则）
pnpm lint-staged

# 按工作区分别触发测试
staged_service=$(git diff --cached --name-only | grep -E '^biological-storage-box-service/.*\.(js|ts)$' || true)
staged_web=$(git diff --cached --name-only | grep -E '^biological-storage-box-web/.*\.(js|ts|d\.ts|vue)$' || true)

if [ -n "$staged_service" ]; then
    printf "%-12b  %b\n" "${GREEN}[GitHook]" "[LOG] 检测到 service 变更，运行测试${RESET}"
    pnpm --filter biological-storage-box-service test
else
    printf "%-12b  %b\n" "${GREEN}[GitHook]" "[LOG] 无 service .js/.ts 变更，跳过 service 测试${RESET}"
fi

if [ -n "$staged_web" ]; then
    printf "%-12b  %b\n" "${GREEN}[GitHook]" "[LOG] 检测到 web 变更，运行测试${RESET}"
    # pnpm --filter biological-storage-box-web test  # 待 web 添加测试后启用
    printf "%-12b  %b\n" "${YELLOW}[GitHook]" "[WARN] web 暂无测试脚本，跳过${RESET}"
fi

printf "%-12b  %b\n" "${GREEN}[GitHook]" "[LOG] Pre-commit hooks 执行完毕${RESET}"
exit 0
```

**Step 3: 验证 hook 正常工作**

修改一个 service TS 文件，暂存后测试 hook：
```bash
# 触发一次 hook 验证
echo "// test" >> biological-storage-box-service/src/main.ts
git add biological-storage-box-service/src/main.ts
git diff --cached --name-only  # 确认暂存
# 不执行 commit，只验证 hook 逻辑，之后 git restore --staged 回滚
git restore --staged biological-storage-box-service/src/main.ts
git restore biological-storage-box-service/src/main.ts
```

**Step 4: Commit**

```bash
git add package.json .husky/pre-commit
git commit -m "chore: update lint-staged and pre-commit for workspace-aware linting

- lint-staged: add per-workspace glob patterns with eslint --fix
- pre-commit: remove manual lint calls (now handled by lint-staged)
- pre-commit: use grep path prefix to trigger per-workspace tests"
```

---

## Task 5: 修复 Dockerfile 使用 pnpm deploy + monorepo 根上下文

**Files:**
- Modify: `biological-storage-box-service/Dockerfile`
- Modify: `biological-storage-box-service/docker-compose.yml`

**Step 1: 重写 Dockerfile**

完整替换 `biological-storage-box-service/Dockerfile` 内容：

```dockerfile
# ===== 构建阶段 =====
FROM node:22.22-slim AS builder

RUN apt-get update -y \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

WORKDIR /repo

# 1. 先只复制 workspace 元文件和所有包的 package.json
#    目的：最大化 Docker 层缓存——只有 package.json 变化时才重新 install
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY biological-storage-box-service/package.json ./biological-storage-box-service/
COPY biological-storage-box-web/package.json ./biological-storage-box-web/
COPY biological-storage-box-docs/package.json ./biological-storage-box-docs/

# 2. 安装全部工作区依赖（lockfile 锁版本）
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3. 复制 service 源码（在 install 之后，避免源码变化导致 install 层缓存失效）
COPY biological-storage-box-service/src ./biological-storage-box-service/src
COPY biological-storage-box-service/tsconfig.json \
     biological-storage-box-service/tsconfig.build.json \
     biological-storage-box-service/nest-cli.json \
     biological-storage-box-service/prisma.config.ts \
     ./biological-storage-box-service/
COPY biological-storage-box-service/prisma ./biological-storage-box-service/prisma
COPY biological-storage-box-service/config ./biological-storage-box-service/config

# 4. 生成 Prisma Client + 编译 TypeScript
ARG DATABASE_URL="postgresql://username:password@host:5432/dbName?schema=public"
ARG SHADOW_DATABASE_URL="postgresql://username:password@host:5432/dbName?schema=public"

RUN cd biological-storage-box-service \
    && pnpm prisma generate \
    && pnpm build

# 5. pnpm deploy：将 service 的纯生产依赖提取到独立目录（无 devDeps，无 symlink）
RUN pnpm --filter biological-storage-box-service deploy --prod /app/deploy

# ===== 运行阶段 =====
FROM node:22.22-slim AS runner

WORKDIR /app

# 从构建阶段复制 deploy 产物
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /repo/biological-storage-box-service/dist ./dist

# .env.* 文件在构建时从 service 目录复制（含加密的 dotenvx 文件）
COPY biological-storage-box-service/.env.* ./

RUN apt-get update -y \
    && apt-get install -y openssl curl \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && rm -rf /var/lib/apt/lists/* \
    && chown -R node:node /app

USER node

ARG APP_VERSION
ARG APP_NAME
ARG GIT_COMMIT

ENV APP_VERSION=$APP_VERSION \
    APP_NAME=$APP_NAME \
    GIT_COMMIT=$GIT_COMMIT \
    NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD curl --fail http://localhost:3000/health

CMD ["sh", "-c", "exec dotenvx run -f .env.${NODE_ENV} -- node dist/src/main.js"]
```

**Step 2: 更新 `docker-compose.yml` 的 build context**

将 `backend` 服务的 `build` 段从：
```yaml
build:
  context: .
  dockerfile: Dockerfile
```
改为：
```yaml
build:
  context: ..
  dockerfile: biological-storage-box-service/Dockerfile
```

同时将 `.env.keys` 挂载路径中的 `./` 改为相对于 service 目录的路径（context 变了，source 路径需要用绝对路径或调整）：
```yaml
volumes:
  - type: bind
    source: ./.env.keys       # 保持不变：docker compose 路径相对于 compose 文件位置
    target: /app/.env.keys
    read_only: true
```

> **注意**：`docker-compose.yml` 中的 `source` 路径是相对于 **compose 文件所在目录**（`biological-storage-box-service/`），不受 `build.context` 影响，所以不需要改。

**Step 3: 验证构建**

```bash
Set-Location biological-storage-box-service
docker compose build --no-cache 2>&1 | Select-Object -Last 20
echo "exit: $LASTEXITCODE"
```

预期：`exporting to image` 成功，exit code 0。

**Step 4: 验证容器启动**

```bash
docker compose up -d
Start-Sleep 15
docker compose ps
```

预期：`backend` 状态为 `healthy`。

**Step 5: Commit**

```bash
Set-Location ..
git add biological-storage-box-service/Dockerfile biological-storage-box-service/docker-compose.yml
git commit -m "chore(service): use pnpm deploy for Docker image build

- build context moved to monorepo root (enables pnpm frozen-lockfile)
- use pnpm deploy --prod to extract production deps without devDeps
- optimize Docker layer cache: copy package.json files before install,
  source code after; prevents reinstall on source-only changes"
```

---

## 验收检查清单

全部任务完成后运行：

```bash
# 格式检查
pnpm run format:check

# 全工作区 lint
pnpm run lint

# service 单独 lint
pnpm --filter biological-storage-box-service lint

# web 单独 lint
pnpm --filter biological-storage-box-web eslint

# service 测试
pnpm --filter biological-storage-box-service test

# web 构建
pnpm --filter biological-storage-box-web build

# docs 构建
pnpm --filter biological-storage-box-docs build

# Docker 构建
Set-Location biological-storage-box-service
docker compose build
```
