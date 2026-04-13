# Monorepo 扁平化重构设计

- **日期**：2026-04-13
- **状态**：已审定
- **作者**：GitHub Copilot（与用户协同设计）

## 背景

`biological-storage-box-service` 是从 NestJS Scaffold fork 而来的后端服务。Scaffold 本身是一个 pnpm workspace（含 `website` 子包），因此导致当前 monorepo 出现**嵌套 workspace** 问题：

```
biological-storage-box/           ← Git 根（无 pnpm workspace）
└── biological-storage-box-service/  ← pnpm workspace 根（含 website 子包）
    └── website/                      ← VitePress 文档站
```

这带来以下问题：

1. `.git` 在根，但 `husky` 钩子在 `service/` 子目录，Git hook 无法被正确触发
2. pnpm 嵌套 workspace 存在依赖提升冲突风险
3. `biological-storage-box-web`（前端）游离在 monorepo 之外，无法共享工具链

## 目标

1. 消除嵌套 workspace，建立扁平三包 monorepo
2. 将 `website/` 抽离并重命名为语义准确的 `biological-storage-box-docs/`
3. Prettier、husky、lint-staged 上移至 Git 根，实现跨包共享
4. 品牌化：清除所有 `nestjs-scaffold` 标识

## 目标结构

```
biological-storage-box/                    ← Git 根 + pnpm monorepo 根
├── pnpm-workspace.yaml                    ← 新建，声明三个 packages
├── package.json                           ← 新建，承接 husky / lint-staged / prettier / 根级脚本
├── .prettierrc.js                         ← 从 service/ 上移
├── .husky/                               ← 从 service/ 上移
│   ├── pre-commit
│   └── post-commit
├── biological-storage-box-service/        ← 后端（去除内部 pnpm-workspace.yaml）
│   ├── package.json                       ← name: biological-storage-box-service
│   ├── eslint.config.js                  ← 保留（TS/NestJS 规则）
│   ├── tsconfig.json / tsconfig.build.json
│   ├── jest.config.js
│   ├── nest-cli.json
│   ├── prisma.config.ts
│   ├── docker-compose.yml                ← name: biological-storage-box
│   ├── Dockerfile
│   └── docs/                             ← 文档内容留在 service（由 service scripts 生成）
├── biological-storage-box-docs/           ← website/ 移动并重命名
│   ├── .vitepress/config.ts              ← srcDir 更新为 ../biological-storage-box-service/docs
│   ├── package.json                       ← name: biological-storage-box-docs
│   ├── Dockerfile.dev / Dockerfile.prod
│   └── api-reference/
└── biological-storage-box-web/           ← 前端（首次纳入 monorepo）
    └── package.json
```

## 各节设计决策

### 1. `docs/` 归属

`docs/` 内容留在 `biological-storage-box-service/` 中，原因：

- Error Reference、OpenAPI JSON 均由 service 的脚本生成（`scripts/generate-error-reference.ts`、`scripts/generate-openapi.ts`）
- 将生成产物写入另一个 package 会造成跨包副作用
- VitePress 站只负责渲染，`srcDir` 指向 service 的 docs 目录

`biological-storage-box-docs/.vitepress/config.ts` 变更：
```ts
// Before
srcDir: '../docs'
// After
srcDir: '../biological-storage-box-service/docs'
```

### 2. 工程化配置分层

**上移至根（共享）：**

| 配置 | 来源 |
|------|------|
| `.prettierrc.js` | `service/` 上移 |
| `.husky/pre-commit` | `service/` 上移，移除 `pnpm test`（测试由 CI 负责） |
| `.husky/post-commit` | `service/` 上移 |
| `lint-staged` 配置段 | 移入根 `package.json` |

**各包保留（不合并）：**

| 配置 | 保留位置 | 理由 |
|------|----------|------|
| `eslint.config.js` | `service/` | NestJS TS 规则不适用于 Vue 前端 |
| `tsconfig.json` | `service/` | NestJS 编译选项专属 |
| `jest.config.js` | `service/` | 后端测试专属 |

### 3. 根 `package.json` 脚本设计

根 `package.json` 提供统一入口脚本，内部委托给各 package：

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "pnpm --filter biological-storage-box-service lint",
    "test": "pnpm --filter biological-storage-box-service test",
    "build": "pnpm --filter biological-storage-box-service build",
    "prepare": "husky"
  }
}
```

### 4. CI/CD 变更

`ci-reusable.yaml` 的命令运行位置天然正确（`.github/` 与 workspace 根同级），但需要以下调整：

| 位置 | 变更 |
|------|------|
| `lint-and-format` job | `pnpm format:check` / `pnpm lint` 在根执行（委托脚本） |
| `test` job | `pnpm --filter biological-storage-box-service prisma generate` 等命令加 filter |
| CI 数据库名 | `nestjs_demo_basic_test` → `bio_storage_box_test` |

### 5. 品牌化（标识替换）

| 文件 | 字段 | 旧值 | 新值 |
|------|------|------|------|
| `service/package.json` | `name` | `nestjs-scaffold` | `biological-storage-box-service` |
| `service/docker-compose.yml` | `name` | `nestjs-scaffold` | `biological-storage-box` |
| `service/Dockerfile` ARG default | `APP_NAME` | `nestjs-scaffold` | `biological-storage-box` |
| `docs/.vitepress/config.ts` | `title` | `NestJS Scaffold` | `Biological Storage Box` |
| `docs-package/package.json` | `name` | `website` | `biological-storage-box-docs` |

## 验收标准

### 工具链

- [ ] `pnpm format:check`（根级）全通过
- [ ] `pnpm --filter biological-storage-box-service lint` 通过
- [ ] `pnpm --filter biological-storage-box-service test` 通过
- [ ] `pnpm --filter biological-storage-box-service build` 通过

### 镜像 & 容器

- [ ] `docker compose build`（`service/docker-compose.yml`）成功
- [ ] `docker compose up` 后 backend + database 健康检查通过
- [ ] `biological-storage-box-docs` `Dockerfile.prod` 构建通过

### API 端点

- [ ] `GET /health` 返回 200
- [ ] `POST /auth/register` 正常响应
- [ ] `POST /auth/login` 正常响应

### Git Hooks

- [ ] `git commit` 从根目录触发 `.husky/pre-commit`
- [ ] `pnpm lint-staged` 成功执行暂存文件格式化

## 不在本次范围内

- 业务模块（org、box、reagent 等）的实现
- 前端 `biological-storage-box-web` 的 TypeScript 化
- OpenAPI JSON 导入与接口合同对齐
