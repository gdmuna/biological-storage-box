# Monorepo Flattening Fixup 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 monorepo 扁平化遗留问题——将 `biological-storage-box-web` 从 yarn 迁移到 pnpm 统一管理，并最终提交所有未入库的变更。

**Architecture:** 当前 pnpm workspace 已包含三个包（service/docs/web），但 web 包仍保留了旧的 yarn/husky/lint-staged 配置，需清理后由根级 husky 统一接管。所有 lint-staged 规则已在根 `package.json` 中涵盖 `*.vue` 文件，web 包的 prettier/eslint devDep 由 pnpm workspace 提升机制共享。

**Tech Stack:** pnpm workspaces, husky v9, lint-staged v16, Prettier v3

---

## 前置说明：已完成但未提交的变更

以下修改已存在于工作区（`git status` 可见），本计划 **不重复实施**，最终 Task 3 的提交会一并入库：

- 根 `pnpm-workspace.yaml` / `package.json` / `.prettierrc.js` / `.prettierignore`
- 根 `.husky/pre-commit`（含条件性测试触发）/ `.husky/post-commit`
- `biological-storage-box-docs/`（从 `biological-storage-box-service/website/` 迁移而来）
- `biological-storage-box-service/package.json`（name/scripts/devDeps 已清理）
- `biological-storage-box-service/eslint.config.js`（移除 website ignores）
- `docker-compose.yml`（service name/db name 已更新）
- `.github/workflows/ci-reusable.yaml`（Extract version 已修复，`--filter` 已添加）
- `.github/copilot-instructions.md`（项目定位与文档导航已更新）

---

## Task 1: 迁移 `biological-storage-box-web` 到 pnpm 管理

**Files:**
- Delete: `biological-storage-box-web/.yarnrc`
- Delete: `biological-storage-box-web/.husky/` (整个目录)
- Modify: `biological-storage-box-web/package.json`

**Step 1: 删除 `.yarnrc`**

```bash
# 在根目录执行
Remove-Item biological-storage-box-web\.yarnrc
```

预期：文件消失，无报错。`.npmrc` 已存在且配置了相同的 npmmirror 镜像，pnpm 会读取 `.npmrc`。

**Step 2: 删除 web 包自带的 `.husky/` 目录**

```bash
Remove-Item -Recurse -Force biological-storage-box-web\.husky
```

预期：`biological-storage-box-web/.husky/` 目录及其 `pre-commit` 文件消失。  
解释：根目录 `.husky/pre-commit` 已统一管理 lint-staged，web 独立 hook 为冗余。

**Step 3: 修改 `biological-storage-box-web/package.json`**

移除以下内容：

- `scripts.prepare`（`"husky install"`）
- `scripts.lint:lint-staged`（`"lint-staged"`）
- `devDependencies` 中的 `husky`、`lint-staged`、`prettier`
- 顶层 `lint-staged` 配置段（`"lint-staged": { ... }`）

修改后的关键字段（保留不变部分省略）：

```json
{
  "name": "biological-storage-box-web",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "eslint": "eslint . --fix",
    "prettier": "prettier . --write"
  },
  "devDependencies": {
    "@mdi/font": "^7.4.47",
    "@varlet/import-resolver": "^3.3.11",
    "@vitejs/plugin-vue": "^5.0.4",
    "autoprefixer": "^10.4.19",
    "daisyui": "^4.9.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-vue": "^9.24.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "unplugin-auto-import": "^0.18.2",
    "unplugin-vue-components": "^0.27.3",
    "vite": "^5.2.0",
    "vite-plugin-vuetify": "^2.0.3",
    "vue-eslint-parser": "^9.4.2"
  }
}
```

注意：`prettier` 和 `lint-staged` 已由根 `package.json` 的 devDependencies 和 `node-linker=hoisted` 提供，web 包无需自己声明。

**Step 4: 在根目录重新生成 `pnpm-lock.yaml`**

```bash
# 在 monorepo 根目录执行
pnpm install --no-frozen-lockfile
```

预期：
- 生成新的根 `pnpm-lock.yaml`
- web 包不再安装 husky/lint-staged/prettier（这三项已从 devDeps 移除）
- 无 peer dependency 警告（或只有可忽略的版本提示）

**Step 5: 验证 web 包构建正常**

```bash
pnpm --filter biological-storage-box-web build
```

预期：输出 `vite build` 构建成功，生成 `dist/` 目录，无报错。

---

## Task 2: 全面验收（所有包）

**Files:** (只读，验证阶段)

**Step 1: 格式检查**

```bash
pnpm run format:check
```

预期：所有文件通过 Prettier 检查，输出 `All matched files use Prettier code style!`。  
如有格式问题：运行 `pnpm run format` 修复后再检查。

**Step 2: Service 代码检查**

```bash
pnpm --filter biological-storage-box-service lint
```

预期：ESLint 无错误（警告可忽略）。

**Step 3: Service 编译检查**

```bash
pnpm --filter biological-storage-box-service build
```

预期：TypeScript 编译成功，输出至 `dist/`，无类型错误。

**Step 4: Service 单元测试**

```bash
pnpm --filter biological-storage-box-service test
```

预期：所有测试通过，`Tests: X passed`。

**Step 5: Docs 站构建验证**

```bash
pnpm --filter biological-storage-box-docs build
```

预期：VitePress 构建成功，无报错，生成 `.vitepress/dist/`。

---

## Task 3: 提交所有变更

**Step 1: 查看完整变更集**

```bash
git status
git diff --stat HEAD
```

预期：看到所有已修改/新增/删除的文件列表，确认无意外文件（如 node_modules、dist 等编译产物不应出现）。

如有意外的编译产物进入暂存区，检查 `.gitignore` 是否遗漏。

**Step 2: 暂存所有变更**

```bash
git add -A
```

**Step 3: 提交**

```bash
git commit -m "chore: flatten monorepo to three-package workspace

- Move .prettierrc.js / .prettierignore / .husky to repo root
- Rename service/website -> biological-storage-box-docs
- Add root pnpm-workspace.yaml and package.json (format + husky)
- Migrate biological-storage-box-web from yarn to pnpm
- Fix CI Extract version to use fs.readFileSync (Node 22 compatible)
- Fix pre-commit hook: add conditional test trigger for .js/.ts
- Update docker-compose: service name and db name
- Update copilot-instructions: point to package-level AGENTS.md"
```

预期：  
- pre-commit hook 触发，lint-staged 运行（格式/lint 检查）
- 如果有 `.js/.ts` 文件被暂存（pnpm-lock.yaml 等不算），还会触发 service 测试
- 提交成功，显示 commit hash 和变更统计

---

## 注意事项

| 项目 | 说明 |
|------|------|
| `node-linker=hoisted` | 根 `.npmrc` 保留此配置，**不处理**（用户决定跳过 Issue 3） |
| `biological-storage-box-web/.npmrc` | 保留（npmmirror 镜像配置，pnpm 需要） |
| web 包的 ESLint 配置 | 保留现有 `.eslintrc.cjs`，各包格式规则自治 |
| `DESIGN.md` | 暂不处理（未列入本次计划范围） |
