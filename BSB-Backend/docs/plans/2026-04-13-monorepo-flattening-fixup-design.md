# Monorepo 扁平化后续修复设计

**Date:** 2026-04-13
**Context:** 第一次 commit 已撤回（`git reset HEAD~1 --soft`），本文档记录已发现的 5 处问题的根因分析与修复方案，供用户审核后转入实施计划。

---

## 问题 1 — CI workflow `Extract version` 语法错误

### 根因

`ci-reusable.yaml` 的 `Extract version` 步骤使用了 Node ESM 动态 import JSON：

```bash
VERSION=$(node -e "import('./biological-storage-box-service/package.json', {assert:{type:'json'}}).then(m=>console.log(m.default.version))")
```

Node 22 已将 `assert` 改为 `with`（`{with:{type:'json'}}`），且 GitHub Actions runner 对异步 `-e` 脚本不保证行为一致。

### 修复方案

改用同步的 `fs.readFileSync`（无需处理 ESM/CJS 兼容问题）：

```bash
VERSION=$(node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync('./biological-storage-box-service/package.json','utf8')).version)")
echo "version=$VERSION" >> "$GITHUB_OUTPUT"
echo "📦 Version: $VERSION"
```

---

## 问题 2 — pre-commit hook 缺少 staged 测试触发逻辑

### 根因

实施时遵循了计划文档中"移除 `pnpm test`"的描述，但计划描述有误——原版 hook 的测试触发是**条件性的**（仅当有 .js/.ts 文件暂存时才触发），而非无条件运行，因此应保留。

### 修复方案

恢复完整版 pre-commit，将 service 内的 dotenvx 命令加上 `--filter`：

```sh
#!/bin/sh

GREEN="\033[32m"; YELLOW="\033[33m"; RESET="\033[0m"

printf "%-12b  %b\n" "\n${GREEN}[GitHook]" "[LOG] 执行 Pre-commit hook...${RESET}"

staged_env_files=$(git diff --cached --name-only -- ':.env.*' ':!.env.keys' ':!.env.example')

if [ -n "$staged_env_files" ]; then
    pnpm --filter biological-storage-box-service dotenvx encrypt -f $staged_env_files
    git add $staged_env_files
fi

if git diff --cached --quiet; then
    printf "%-12b  %b\n" "${YELLOW}[GitHook]" "[WARN] 无暂存文件，跳出 Pre-commit hooks${RESET}"
    exit 0
fi

pnpm lint-staged

staged_has_scripts=$(git diff --cached --name-only -- '*.js' '*.ts')
if [ -z "$staged_has_scripts" ]; then
    printf "%-12b  %b\n" "${GREEN}[GitHook]" "[LOG] 无暂存的 .js/.ts 文件，跳过测试${RESET}"
else
    pnpm --filter biological-storage-box-service test
fi

printf "%-12b  %b\n" "${GREEN}[GitHook]" "[LOG] Pre-commit hooks 执行完毕${RESET}"
exit 0
```

---

## 问题 3 — `node-linker=hoisted` 导致根 node_modules 膨胀

### 根因

`node-linker=hoisted` 将所有包铺平到根 `node_modules`（等同于原始 npm/yarn 行为），因此目录巨大。添加该配置的原因是 VitePress 构建时 `vue/server-renderer` 无法解析——这是 pnpm workspace 的幻象依赖隔离特性导致的已知问题。

### 修复方案

移除 `node-linker=hoisted`，改用 `public-hoist-pattern` 精确提升 Vue 相关包：

```ini
# 根 .npmrc（替换原内容）
auto-install-peers=true
public-hoist-pattern[]=@vue*
public-hoist-pattern[]=vue
```

**效果**：
- 根 `node_modules` 仅含 hoisted 的 vue/vue-related 包 + 根级 devDependencies
- pnpm 其余包仍保持 content-addressable store + symlink，磁盘占用大幅减少
- VitePress 可解析 `vue/server-renderer`，构建正常

---

## 问题 4 — biological-storage-box-web 迁移至 pnpm

### 当前状态

| 项目 | 现状 |
|------|------|
| `.yarnrc` | 存在，配置了 npmmirror 镜像 |
| `.npmrc` | 存在，配置了 npmmirror 镜像（与 .yarnrc 内容等价） |
| `.husky/pre-commit` | 仅一行 `npx lint-staged` |
| `package.json scripts.prepare` | `"husky install"` |
| `devDependencies` | 包含 `husky`、`lint-staged`、`prettier` |
| lock 文件 | **无**（node_modules 存在但无 lock 文件，推测 node_modules 是旧的 yarn/npm 安装产物） |

### 修复方案

1. 删除 `.yarnrc`（`.npmrc` 已有等价镜像配置，pnpm 读取 `.npmrc`）
2. 删除 `.husky/`（根目录 husky 统一管理，`.husky/pre-commit` 的 `lint-staged` 已迁移至根）
3. `package.json` 修改：
   - 移除 `scripts.prepare`
   - 移除 `devDependencies` 中的 `husky`、`lint-staged`、`prettier`（根级已提供）
   - 移除 `lint-staged` 配置段（根 `package.json` 的 lint-staged 已包含 `*.vue` 规则）
4. 保留 web 自己的 `.eslintrc.cjs`、`.prettierrc.cjs`（与 service 规则不同，格式规则各包自治）
5. 生成新的 `pnpm-lock.yaml`：在根目录 `pnpm install --no-frozen-lockfile`

---

## 问题 5 — AGENTS.md / DESIGN.md 位置策略

### AGENTS.md

**推荐：根目录放 + 各包放**，职责分层：

| 位置 | 内容 |
|------|------|
| 根 `AGENTS.md` | GitNexus 指令、monorepo 级约定（当前内容） |
| `biological-storage-box-service/AGENTS.md` | service 特有约束（已存在） |
| 其他包的 `AGENTS.md` | 各包特有约束 |

VS Code Copilot 通过 `.github/copilot-instructions.md` 按需引用根 `AGENTS.md`，这是正确的做法——不需要自动全量加载，按场景触发即可。

### DESIGN.md

当前根目录的 `DESIGN.md` 是 `biological-storage-box-web` 的 Linear 设计系统文档，与 service/docs 无关。

**推荐**：移至 `biological-storage-box-web/DESIGN.md`（保持 markdown 文件在对应包内）。

---

## 变更清单汇总

| 文件 | 操作 |
|------|------|
| `.github/workflows/ci-reusable.yaml` | 修改 `Extract version` 命令 |
| `.husky/pre-commit` | 恢复完整版（含条件测试触发） |
| `.npmrc` | 移除 `node-linker=hoisted`，改为 `public-hoist-pattern[]` |
| `biological-storage-box-web/.yarnrc` | 删除 |
| `biological-storage-box-web/.husky/` | 删除 |
| `biological-storage-box-web/package.json` | 移除 prepare/husky/lint-staged |
| `DESIGN.md` | 移至 `biological-storage-box-web/DESIGN.md` |
| `pnpm-lock.yaml`（根） | 重新生成 |
