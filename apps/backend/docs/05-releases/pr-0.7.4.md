---
title: "发布 PR：v0.7.4"
version: "0.7.4"
base: main
branch: release/0.7
date: 2026-04-09
---

# 发布 v0.7.4

## 概述

本 PR 将 `release/0.7` 分支合并至 `main`，发布 v0.7.4 版本。主要内容：项目正式更名为 **NestJS Scaffold**；文档站全面重构（目录重整、新增入门文档区与 Harness Engineering 文档区）；文档站路由重写为语义化 URL（/guide/ / /reference/）、侧边栏双分区重构；新增关于本项目页；hero 图片及首页更新；后端容器改为非 root 用户运行；依赖 minor 版本升级；修复 Docker 构建 CHANGELOG 缺失及 API reference 路径问题。

## 变更内容

### ✨ 新功能 / 改进

#### 项目重命名

- **NestJS Demo Basic → NestJS Scaffold**（`chore`）— 项目正式更名
  - `package.json` `name`: `nestjs-demo-basic` → `nestjs-scaffold`，`version`: `0.7.3` → `0.7.4`
  - `docker-compose.yml`: compose project name 及 `APP_NAME` 默认值由 `nestjs-demo-basic` 改为 `nestjs-scaffold`
  - `src/main.ts`: Swagger 标题 `Nestjs-Demo-Basic API` → `NestJS Scaffold API`；figlet 启动 Banner 同步更新
  - 全局文档中所有展示名称（含目录结构示例、docker image 示例）同步替换

#### 文档站全面重构

- **目录编号重整**（`docs`）— 原有目录整体上移一级，腾出前置位编号给新增的入门文档区：
  - `docs/02-architecture/` → `docs/03-architecture/`
  - `docs/03-reference/` → `docs/04-reference/`
  - `docs/04-planning/` → `docs/05-releases/`（目录职责同步调整为"发布文档"）
  - `docs/05-audits/` → `docs/06-audits/`
- **新增 `docs/00-getting-started/`**（`docs`）— 入门文档区
  - `introduction.md`：项目简介、核心理念、分层架构 Mermaid、技术栈、目录结构
  - `philosophy.md`：核心设计理念深度解析
  - `quick-start.md`：5 分钟快速启动指南
- **新增 `docs/02-harness/`**（`docs`）— Harness Engineering 专项文档区
  - `overview.md`：Harness Engineering 整体框架
  - `feedback.md`：反馈回路（测试 / CI / lint）
  - `feedforward.md`：前馈引导（AGENTS.md / 文档 / 架构规范）
  - `STANDARD.md`：本区文档写作规范
- **新增站点基础文件**（`docs`）— `docs/index.md`（VitePress 首页）、`docs/changelog.md`（文档内变更日志页）、`docs/public/img/logo-small.svg`
- **新增 `docs/01-guides/`** 指南文档（`docs`）：
  - `development-workflow.md`：本地开发工作流
  - `docker-deployment.md`：容器化部署指南
  - `environment-setup.md`：环境搭建详细步骤
  - `testing.md`：测试策略与运行说明
  - `contributing.md`：重写贡献指南
- **架构文档内容对齐**（`docs`）— `docs/03-architecture/` 三份文档去除"规划期"写法：
  - `exception-system.md`：§1 由"设计动机"改为"设计背景"，`AppException` 接口定义对齐实现，ErrorRegistry 路径更新
  - `route-decorator.md`：§1 时态更正，§9"向后兼容"改为"迁移历史"
  - `openapi-enrichment.md`：§2 流水线描述对齐实际实现（`wrapSuccessResponses`、`enrichErrorResponses`、`enrichTagDescriptions`），§9 配置代码块更新为实际 `main.ts` 内容，ERROR_CATALOG 引用改为 ErrorRegistry
- **全局文案替换**（`docs`）— 中文"驾驭工程"全部替换为英文"Harness Engineering"（含文档正文、frontmatter title、VitePress 导航/侧边栏）
- **README.md 重写**（`docs`）— 新增功能特性矩阵、Harness Engineering 介绍、项目目录结构速览、快速启动命令

#### 容器安全

- **后端容器改为非 root 用户运行**（`feat(dockerfile)`）
  - `Dockerfile` runner 阶段新增 `RUN chown -R node:node /app` 和 `USER node`
  - 使用 `node:22-slim` 内置的 `node` 用户（uid=1000），无需额外安装
  - 遵循最小权限原则，符合容器安全最佳实践和 OWASP 建议

#### VitePress 站点升级

- **任务列表渲染支持**（`chore(website)`）— `website/package.json` 新增 `@mdit/plugin-tasklist`，`website/.vitepress/config.ts` 集成插件
- **侧边栏重构**（`chore(website)`）— 新增 Harness Engineering（02-harness）、Getting Started（00-getting-started）等新节；移除已废弃的 `02-architecture` 配置
- **导航文案更新**（`chore(website)`）— `驾驭工程` → `Harness Engineering`，`什么是驾驭工程` → `什么是 Harness Engineering`
- **站点标题更新**（`chore(website)`）— `NestJS Demo Basic` → `NestJS Scaffold`

#### 文档站路由与导航重构（后续增补）

- **VitePress 语义化路由**（`docs(vitepress)`）— 新增 `rewrites` 配置，将编号目录路径映射为可读 URL，文件路径不变：
  - `/guide/*`：涵盖 `00-getting-started/`、`01-guides/`、`04-reference/` 附录类内容
  - `/reference/*`：涵盖 `02-harness/`、`03-architecture/` 深度文档
- **侧边栏双分区重构**（`docs(vitepress)`）— 上手（/guide/）/ 深入（/reference/）两个独立侧边栏，nav 条目重命名并添加 `activeMatch`，解决落地页 404 与高亮缺失问题
- **搜索索引修复**（`docs(vitepress)`）— `srcExclude` 排除 `STANDARD.md` / `AGENTS.md`，修复 rewrites 后同名文件映射重复路由导致 MiniSearch 抛错
- **Hero 品牌资产**（`assets(docs)`）— 新增三种规格 logo 图片（PNG / WebP）；`style.css` 添加响应式尺寸断点；首页 hero 更新图片源、精简文案、重组 actions 按钮
- **关于本项目页**（`docs`）— 新增 `about.md`，合并 Maintainers 与致谢内容（路由 `/guide/about`）
- **更新日志文档迁移**（`docs`）— `docs/changelog.md` → `docs/04-reference/CHANGELOG.md`，通过 `@include` 导入根目录 `CHANGELOG.md`

### 🐛 修复（后续增补）

- **`fix(docker)`**：Dockerfile.dev / prod 构建阶段补加 `COPY CHANGELOG.md ./`，修复生产镜像中 `@include` 内容为空的问题；API reference 路径统一更新（`/reference/api/` → `/api-reference/`）
- **`fix(docs)`**：修复 `external-resources.md` 重复节标题
- **`docs(readme)`**：补全文档站访问链接；精简 README，移除与文档站重复的章节

### 📁 文档重构（后续增补）

- **`refactor(docs)`**：`docs/04-reference/` 重命名为 `docs/04-appendix/`，与实际定位（附录）一致；同步更新 VitePress rewrites 规则、脚本输出路径、常量默认值及所有文档内引用
- **`docs(harness)`**：`docs/02-harness/overview.md` 末尾新增局限性说明块，诚实披露当前实现与文档描述之间的差距
- **`docs`**：`README.md` 与 `docs/00-getting-started/introduction.md` 新增“尚未发布首个稳定大版本”说明块，明确告知项目尚未发布 `1.0.0`（首个 Major 版本升级），接口契约在此之前不稳定，建议锁定到特定 commit 或 tag

### 🛠️ 杂项 / 工程化

- **`chore`**：`AGENTS.md` 升至 v0.7.4
  - 路径引用更新（`docs/02-architecture/` → `docs/03-architecture/`）
  - 删除 YAGNI 章节（内容已整合至 `docs/STANDARD.md`）、删除防御性编程章节（边界已由 Zod 统一处理，不需要单独原则提醒）
  - §3.1 验证序列新增 `pnpm format` 前置步骤；§5.3 检查清单同步
  - `.github/copilot-instructions.md` 架构文档路径同步更新
- **`fix(scripts)`**：`scripts/generate-error-reference.ts` 输出路径 `03-reference` → `04-reference`
- **`fix`**：`src/constants/observability.constant.ts` `ERROR_REFERENCE_URL` 默认值路径同步更新

### 📦 依赖升级

- **`build`**：`pnpm update -r` 升级 minor 版本

  | 包 | 旧版本 | 新版本 |
  |---|---|---|
  | `@dotenvx/dotenvx-ops` | `^0.37.4` | `^0.37.8` |
  | `@nestjs/config` | `^4.0.3` | `^4.0.4` |
  | `@nestjs/swagger` | `^11.2.6` | `^11.2.7` |
  | `@prisma/adapter-pg` | `^7.6.0` | `^7.7.0` |
  | `@prisma/client` | `^7.6.0` | `^7.7.0` |
  | `prisma` | `^7.6.0` | `^7.7.0` |
  | `@nestjs/cli` | `^11.0.17` | `^11.0.19` |
  | `@typescript-eslint/*` | `^8.58.0` | `^8.58.1` |

## 文件变更统计

```
.github/copilot-instructions.md    ← 架构文档路径更新
AGENTS.md                          ← 版本更新、章节删减、验证步骤新增
CHANGELOG.md                       ← 新增 v0.7.4 条目，历史路径引用修正
Dockerfile                         ← 新增非 root 用户配置
README.md                          ← 全面重写
docker-compose.yml                 ← 项目名称更新
package.json                       ← 项目重命名 + 版本升级 + 依赖 minor 升级
pnpm-lock.yaml                     ← pnpm update 全量重算
scripts/generate-error-reference.ts ← 输出路径更新
src/constants/observability.constant.ts ← ERROR_REFERENCE_URL 路径更新
src/main.ts                        ← Swagger 标题 + figlet Banner 更新

docs/00-getting-started/           ← 新增（introduction、philosophy、quick-start）
docs/02-harness/                   ← 新增（overview、feedback、feedforward、STANDARD）
docs/index.md                      ← 新增（VitePress 首页）
docs/changelog.md                  ← 新增（文档站变更日志页）
docs/public/img/logo-small.svg     ← 新增（站点 logo）
docs/01-guides/development-workflow.md ← 新增
docs/01-guides/docker-deployment.md    ← 新增
docs/01-guides/environment-setup.md    ← 新增
docs/01-guides/testing.md              ← 新增
docs/01-guides/contributing.md         ← 重写

docs/{02→03}-architecture/         ← 目录重命名（10 个文件）
    exception-system.md            ← 内容对齐实现现状
    route-decorator.md             ← 内容对齐实现现状
    openapi-enrichment.md          ← 流水线描述重写
docs/{03→04}-reference/            ← 目录重命名（2 个文件）
docs/03-reference/api-reference.md ← 删除（内容整合进 04-reference）
docs/{04-planning→05-releases}/    ← 目录重命名（4 个 PR 文档）
docs/04-planning/STANDARD.md      ← 删除（合并进 05-releases/STANDARD.md）
docs/04-planning/roadmap.md       ← 删除
docs/{05→06}-audits/               ← 目录重命名
docs/04-reference/external-resources.md ← 新增
docs/05-releases/STANDARD.md      ← 新增（发布文档规范）
docs/05-releases/pr-0.7.4.md      ← 新增（本文件）
docs/AGENTS.md                    ← 更新路径引用
docs/README.md                    ← 更新目录索引
docs/STANDARD.md                  ← 更新 Harness Engineering 相关内容

website/.vitepress/config.ts      ← 侧边栏重构、标题更新、tasklist 插件
website/Dockerfile.dev            ← 配置更新
website/Dockerfile.prod           ← 配置更新
website/nginx.dev.conf            ← 配置更新
website/nginx.prod.conf           ← 配置更新
website/package.json              ← 新增 @mdit/plugin-tasklist

# 后续增补（同 release/0.7 分支）
docs/{04-reference → 04-appendix}/  ← 目录重命名，含 STANDARD.md 自引用更新
scripts/generate-error-reference.ts ← 输出路径 04-reference → 04-appendix
src/constants/observability.constant.ts ← ERROR_REFERENCE_URL 默认值路径更新
docs/README.md                    ← 目录节标题 + 链接更新
docs/STANDARD.md                  ← 树形图、分类表、索引表更新
AGENTS.md                         ← 继承链树形图更新
docs/02-harness/overview.md       ← 新增局限性说明块（:::warning）
```

## 测试验证

- `pnpm format` — ✅ 通过
- `pnpm lint` — ✅ 通过
- `pnpm build` — ✅ 通过（tsc + tsc-alias，42 files）
- `pnpm test` — ✅ 通过（7 suites, 21 tests, 0 failures）
- `pnpm build`（VitePress）— ✅ 通过（8.6s）

## 检查清单

- [x] `pnpm format` — 格式化通过
- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] `pnpm test` — 通过
- [x] CHANGELOG 已更新（`CHANGELOG.md` 新增 v0.7.4 条目）
- [x] 文档站构建通过（VitePress build 无报错）
- [x] 项目重命名已覆盖所有非远程仓库引用
