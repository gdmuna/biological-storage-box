# Monorepo 扁平化重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将嵌套 workspace 结构扁平化为三包 monorepo，清除 nestjs-scaffold 标识，使 husky/prettier/lint-staged 在 Git 根正确运行。

**Architecture:** 根级新建 pnpm workspace，`biological-storage-box-service/website/` 移动并重命名为根级 `biological-storage-box-docs/`；Prettier、husky、lint-staged 上移至根；各包保留各自 eslint / tsconfig / jest。

**Tech Stack:** pnpm workspaces, husky v9, lint-staged, prettier, ESLint v9, Docker multi-stage build, GitHub Actions

---

## 前置说明

- 所有命令在 monorepo 根目录 `f:\tech-otaku\code\biological-storage-box\` 执行，除非特别标注
- `service/` 是 `biological-storage-box-service/` 的简写
- `docs/` 是即将创建的 `biological-storage-box-docs/` 的简写

---

### Task 1：建立根级 pnpm workspace

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`

**Step 1: 创建根级 `pnpm-workspace.yaml`**

```yaml
packages:
  - 'biological-storage-box-service'
  - 'biological-storage-box-docs'
  - 'biological-storage-box-web'

onlyBuiltDependencies:
  - '@nestjs/core'
  - '@prisma/engines'
  - '@scarf/scarf'
  - esbuild
  - prisma
  - unrs-resolver
```

**Step 2: 创建根级 `package.json`**

```json
{
  "name": "biological-storage-box",
  "private": true,
  "version": "0.7.4",
  "description": "生物样本储存管理系统 monorepo",
  "type": "module",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=8.0.0"
  },
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "pnpm --filter biological-storage-box-service lint",
    "test": "pnpm --filter biological-storage-box-service test",
    "build": "pnpm --filter biological-storage-box-service build",
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^16.4.0",
    "prettier": "^3.8.1"
  },
  "lint-staged": {
    "**/*.{js,ts,jsx,tsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "**/*.{json,md,css,scss,html,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

**Step 3: 提交**

```bash
git add pnpm-workspace.yaml package.json
git commit -m "chore(workspace): 建立根级 pnpm monorepo"
```

---

### Task 2：上移 Prettier 和 husky 配置

**Files:**
- Move: `biological-storage-box-service/.prettierrc.js` → `.prettierrc.js`
- Move: `biological-storage-box-service/.husky/pre-commit` → `.husky/pre-commit`
- Move: `biological-storage-box-service/.husky/post-commit` → `.husky/post-commit`
- Modify: `biological-storage-box-service/package.json`

**Step 1: 复制 `.prettierrc.js` 到根目录（保持内容不变）**

从 `biological-storage-box-service/.prettierrc.js` 复制到根目录 `.prettierrc.js`。

**Step 2: 创建根级 `.husky/pre-commit`**

内容与原 `service/.husky/pre-commit` 相同，但移除 `pnpm test` 部分（测试由 CI 负责，本地 hook 只做 lint-staged）：

```sh
#!/bin/sh

GREEN="\033[32m"; YELLOW="\033[33m"; RESET="\033[0m"

printf "%-12b  %b\n" "\n${GREEN}[GitHook]" "[LOG] 执行 Pre-commit hook...${RESET}"

# 记录已暂存的 env 文件（排除 .env.keys 和 .env.example）
staged_env_files=$(git diff --cached --name-only -- ':.env.*' ':!.env.keys' ':!.env.example')

# 如果有暂存的 env 文件，先加密它们
if [ -n "$staged_env_files" ]; then
    pnpm --filter biological-storage-box-service dotenvx encrypt -f $staged_env_files
    git add $staged_env_files
fi

if git diff --cached --quiet; then
    printf "%-12b  %b\n" "${YELLOW}[GitHook]" "[WARN] 无暂存文件，跳出 Pre-commit hooks${RESET}"
    exit 0
fi

pnpm lint-staged
```

**Step 3: 创建根级 `.husky/post-commit`**

```sh
#!/bin/sh

wsl bash -c "fortune|cowsay|lolcat" || true
```

**Step 4: 从 `service/package.json` 移除以下字段**

移除 `husky`、`lint-staged`、`prettier` devDependencies，移除 `lint-staged` 配置段，移除 `"prepare": "husky"` 脚本，移除 `"format"`、`"format:check"` 脚本。

保留 `lint`、`lint:fix`、`lint:staged` 脚本（ESLint 仍在 service 本地）。

**Step 5: 删除 `service/.husky/`、`service/.prettierrc.js`**

```bash
# Windows PowerShell
Remove-Item -Recurse -Force biological-storage-box-service\.husky
Remove-Item biological-storage-box-service\.prettierrc.js
```

**Step 6: 初始化根级 husky**

```bash
pnpm install
pnpm husky
```

预期输出：`husky - Git hooks installed`

**Step 7: 验证 hook 文件可执行（Git Bash / WSL）**

```bash
ls -la .husky/
```

预期：`pre-commit`、`post-commit` 存在

**Step 8: 提交**

```bash
git add .prettierrc.js .husky/ biological-storage-box-service/package.json
git commit -m "chore(workspace): 上移 prettier 和 husky 至 monorepo 根"
```

---

### Task 3：移动并重命名 website → biological-storage-box-docs

**Files:**
- Move: `biological-storage-box-service/website/` → `biological-storage-box-docs/`
- Modify: `biological-storage-box-service/pnpm-workspace.yaml` → 删除
- Modify: `biological-storage-box-docs/package.json`
- Modify: `biological-storage-box-docs/.vitepress/config.ts`
- Modify: `biological-storage-box-service/eslint.config.js`
- Modify: `biological-storage-box-service/package.json` scripts

**Step 1: 移动目录**

```bash
# PowerShell
Move-Item biological-storage-box-service\website biological-storage-box-docs
```

**Step 2: 更新 `biological-storage-box-docs/package.json` name**

```json
{
  "name": "biological-storage-box-docs"
}
```

**Step 3: 更新 `biological-storage-box-docs/.vitepress/config.ts` 的 `srcDir`**

```ts
// Before
srcDir: '../docs',
// After
srcDir: '../biological-storage-box-service/docs',
```

同时更新 title 和 description：

```ts
title: 'Biological Storage Box',
description: '生物样本储存管理系统',
```

**Step 4: 更新 `biological-storage-box-docs/Dockerfile.prod`**

文件中硬编码了 `website/` 路径，需要更新：

```dockerfile
# Before
COPY website/package.json ./website/
# After
COPY biological-storage-box-docs/package.json ./biological-storage-box-docs/

# Before
COPY website ./website
# After（以及所有 website/ 引用均替换为 biological-storage-box-docs/）
COPY biological-storage-box-docs ./biological-storage-box-docs

# Before
COPY --from=builder /app/website/dist /usr/share/nginx/html
# After
COPY --from=builder /app/biological-storage-box-docs/dist /usr/share/nginx/html

# Before
COPY --from=builder /app/website/api-reference/index.html ...
# After
COPY --from=builder /app/biological-storage-box-docs/api-reference/index.html ...

# Before
COPY website/nginx.prod.conf /etc/nginx/conf.d/default.conf
# After
COPY biological-storage-box-docs/nginx.prod.conf /etc/nginx/conf.d/default.conf
```

**Step 5: 删除 `biological-storage-box-service/pnpm-workspace.yaml`**

```bash
Remove-Item biological-storage-box-service\pnpm-workspace.yaml
```

**Step 6: 更新 `biological-storage-box-service/eslint.config.js`**

移除 `ignores` 中的 website 路径（已不在 service 目录下）：

```js
// Before
ignores: ['website/.vitepress/cache/', 'website/dist/'],
// After
ignores: [],
// 或删除整个 ignores 配置块（如无其他 ignore 项）
```

**Step 7: 更新 `service/package.json` 中的 docs 脚本**

```json
"docs:dev": "pnpm docs:gen-reference && dotenvx run -f .env.development -- pnpm --filter biological-storage-box-docs dev",
"docs:build": "pnpm docs:gen-reference && pnpm --filter biological-storage-box-docs build",
"docs:serve": "pnpm --filter biological-storage-box-docs serve"
```

**Step 8: 在根目录安装依赖**

```bash
pnpm install
```

预期：三个 packages 均被识别

**Step 9: 提交**

```bash
git add -A
git commit -m "chore(workspace): 将 website 抽离为 biological-storage-box-docs"
```

---

### Task 4：品牌化 — 清除 nestjs-scaffold 标识

**Files:**
- Modify: `biological-storage-box-service/package.json`
- Modify: `biological-storage-box-service/docker-compose.yml`
- Modify: `biological-storage-box-service/Dockerfile`

**Step 1: 更新 `service/package.json`**

```json
{
  "name": "biological-storage-box-service",
  "description": "生物样本储存管理系统 — 后端服务"
}
```

**Step 2: 更新 `service/docker-compose.yml`**

```yaml
# Before
name: nestjs-scaffold
# After
name: biological-storage-box
```

同时更新数据库默认值（降低与 Scaffold 冲突风险）：

```yaml
POSTGRES_DB: ${POSTGRES_DB:-bio_storage_box}
POSTGRES_MULTIPLE_DATABASES: ${POSTGRES_DB:-bio_storage_box_shadow}
# healthcheck 中的 -d 参数同步更新
test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-nestjs} -d ${POSTGRES_DB:-bio_storage_box}']
# DATABASE_URL 默认值
DATABASE_URL: postgresql://${POSTGRES_USER:-nestjs}:${POSTGRES_PASSWORD:-nestjs_password}@database:5432/${POSTGRES_DB:-bio_storage_box}?schema=public
SHADOW_DATABASE_URL: postgresql://${POSTGRES_USER:-nestjs}:${POSTGRES_PASSWORD:-nestjs_password}@database:5432/${POSTGRES_DB:-bio_storage_box_shadow}?schema=public
```

**Step 3: 更新 `service/Dockerfile` ARG 默认值**

```dockerfile
# Before
ARG APP_NAME: ${APP_NAME:-nestjs-scaffold}
# After
ARG APP_NAME: ${APP_NAME:-biological-storage-box}
```

**Step 4: 提交**

```bash
git add biological-storage-box-service/package.json \
        biological-storage-box-service/docker-compose.yml \
        biological-storage-box-service/Dockerfile
git commit -m "chore(brand): 清除 nestjs-scaffold 标识，品牌化为 biological-storage-box"
```

---

### Task 5：更新 CI/CD 工作流

**Files:**
- Modify: `.github/workflows/ci-reusable.yaml`

**Step 1: 更新 `lint-and-format` job**

所有命令前加 filter（pnpm workspace filter）：

```yaml
- name: Format check
  run: pnpm format:check        # 根级命令，无需 filter，直接覆盖三个包

- name: Lint
  run: pnpm --filter biological-storage-box-service lint
```

**Step 2: 更新 `test` job 中的 service 相关命令**

```yaml
- name: Extract version
  run: |
    VERSION=$(node -e "import('./biological-storage-box-service/package.json', {assert:{type:'json'}}).then(m=>console.log(m.default.version))")
    echo "version=$VERSION" >> "$GITHUB_OUTPUT"
    echo "📦 Version: $VERSION"

- name: Generate Prisma Client
  run: pnpm --filter biological-storage-box-service prisma generate

- name: Sync schema (CI DB)
  run: pnpm --filter biological-storage-box-service prisma migrate deploy
  # 或者：prisma db push --skip-generate

- name: Build application
  run: pnpm --filter biological-storage-box-service build

- name: Run tests
  run: pnpm --filter biological-storage-box-service test
```

**Step 3: 更新 CI 数据库名**

```yaml
# Before
POSTGRES_DB: nestjs_demo_basic_test
# After
POSTGRES_DB: bio_storage_box_test

# 所有 DATABASE_URL 中的数据库名同步更新
DATABASE_URL: postgresql://ci_test:ci_test_password@localhost:5432/bio_storage_box_test?schema=public
```

**Step 4: 运行 CI 本地模拟（可选，有 act 的情况下）**

```bash
act push --job lint-and-format
```

**Step 5: 提交**

```bash
git add .github/workflows/ci-reusable.yaml
git commit -m "ci: 适配 monorepo 扁平化，更新 filter 和数据库名"
```

---

### Task 6：验收检查

**Step 1: 格式化检查**

```bash
pnpm format:check
```

预期：全部通过，无格式错误

**Step 2: Lint 检查**

```bash
pnpm --filter biological-storage-box-service lint
```

预期：无 ESLint 错误

**Step 3: 构建**

```bash
pnpm --filter biological-storage-box-service build
```

预期：`dist/` 生成，无编译错误

**Step 4: 测试**

```bash
pnpm --filter biological-storage-box-service test
```

预期：all tests pass（需要本地数据库运行）

**Step 5: 文档站本地预览**

```bash
pnpm --filter biological-storage-box-docs dev
```

预期：VitePress 启动，docs 内容正常渲染

**Step 6: Docker 构建**

```bash
cd biological-storage-box-service
docker compose build
```

预期：backend 镜像构建成功

**Step 7: 容器启动与健康检查**

```bash
docker compose up -d
docker compose ps
```

预期：database `healthy`，backend `healthy`

**Step 8: API 端点验证**

```bash
curl http://localhost:3000/health
```

预期：`{ "status": "ok" }` 或类似 200 响应

**Step 9: 最终提交**

```bash
git add -A
git commit -m "chore: monorepo 扁平化重构完成，所有验收检查通过"
```

---

## 已知风险与注意事项

| 风险 | 说明 | 处置 |
|------|------|------|
| `biological-storage-box-docs/Dockerfile.prod` 中大量硬编码 `website/` 路径 | 见 Task 3 Step 4 | 逐一替换 |
| `service/eslint.config.js` 中的 `website/` ignores | 见 Task 3 Step 6 | 删除或更新 |
| husky `prepare` 脚本在 CI 中触发 | CI 中 `pnpm install` 会执行 `prepare: husky`，需确保 CI 不报错 | 根 `package.json` 的 `prepare` 脚本中加 `is-ci` guard，或在 CI step 中设置 `HUSKY=0` |
| git `COPY .git` in Dockerfile.prod | docs 镜像构建时需要 `.git` 用于生成 CHANGELOG，需从 monorepo 根构建 context | docker build context 改为 monorepo 根 |
