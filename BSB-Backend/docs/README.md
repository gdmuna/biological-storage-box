---
title: 文档索引
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: meta
---

# 文档索引

本文件是 `docs/` 目录的元文档索引，供 AI 助手和开发者在撰写/维护文档时快速定位资源。

> **注意**：本文件与 AGENTS.md、STANDARD.md 同为元文档，不对应文档站的任何页面。文档站首页由 `docs/index.md` 提供。

## 文档清单

### 顶层元文档

| 文档 | 状态 | 说明 |
|------|------|------|
| [README.md](README.md) | active | 本文件：文档索引（元文档，不进文档站）|
| [AGENTS.md](AGENTS.md) | active | AI 文档操作手册：文档变更工作流、漂移防护、版本同步 |

### 00-getting-started/ — 入门

| 文档 | 状态 | 说明 |
|------|------|------|
| [introduction.md](00-getting-started/introduction.md) | active | 项目简介：核心特性、技术栈、设计原则概览 |
| [quick-start.md](00-getting-started/quick-start.md) | active | 快速上手：5 分钟将项目跑起来 |
| [philosophy.md](00-getting-started/philosophy.md) | active | 核心理念： Harness Engineering 、文档即代码、测试驱动开发 |

### 01-guides/ — 指南

| 文档 | 状态 | 说明 |
|------|------|------|
| [environment-setup.md](01-guides/environment-setup.md) | active | 本地开发环境搭建：Node.js、pnpm、PostgreSQL、dotenvx |
| [development-workflow.md](01-guides/development-workflow.md) | active | 开发工作流：日常流程、新增模块、数据库变更 |
| [testing.md](01-guides/testing.md) | active | 测试指南：单元测试、E2E 测试、CI 集成 |
| [docker-deployment.md](01-guides/docker-deployment.md) | active | Docker 与部署：本地镜像、文档站镜像、CI/CD 流水线 |
| [contributing.md](01-guides/contributing.md) | active | 贡献指南：分支策略、提交规范（Conventional Commits）、发布流程 |

### 03-architecture/ — 架构

| 文档 | 状态 | 说明 |
|------|------|------|
| [project-architecture-overview.md](03-architecture/project-architecture-overview.md) | active | 主节点：技术栈、系统分层图、模块职责、子文档导航 |
| [request-pipeline.md](03-architecture/request-pipeline.md) | active | 请求生命周期：中间件→守卫→管道→拦截器→异常过滤器全链路 |
| [auth-module.md](03-architecture/auth-module.md) | active | 认证模块：JWT ES256 双令牌、Cookie 配置、令牌轮换流程 |
| [database.md](03-architecture/database.md) | active | 数据库层：连接池、慢查询监控、参数脱敏、Prisma 错误映射 |
| [exception-system.md](03-architecture/exception-system.md) | active | 异常系统设计：异常类层级、错误码体系、to() 包装模式 |
| [route-decorator.md](03-architecture/route-decorator.md) | active | @ApiRoute 装饰器：认证策略、元数据键、消费层分工 |
| [openapi-enrichment.md](03-architecture/openapi-enrichment.md) | active | OpenAPI 自动富化：成功包络注入、失败响应示例、全局 Schema 注册 |
| [observability.md](03-architecture/observability.md) | active | 可观测性：Pino 日志、AsyncLocalStorage 链路追踪、告警阈值 |
| [cicd-deployment.md](03-architecture/cicd-deployment.md) | active | CI/CD 与部署：Workflow 矩阵、自动打标、Docker 多阶段构建 |

### 04-appendix/ —— 附录

| 文档 | 状态 | 说明 |
|------|------|------|
| [error-reference.md](04-appendix/error-reference.md) | active | 错误码参考（自动生成，勿手改） |
| [external-resources.md](04-appendix/external-resources.md) | active | 参考资源：API 文档入口、NestJS、Prisma、Zod、VitePress 官方文档链接 |

### 05-releases/ — 发布规划

| 文档 | 状态 | 说明 |
|------|------|------|
| [pr-0.7.3.md](05-releases/pr-0.7.3.md) | active | v0.7.3 发布说明 |
| [pr-0.7.2.md](05-releases/pr-0.7.2.md) | active | v0.7.2 发布说明 |
| [pr-0.7.1.md](05-releases/pr-0.7.1.md) | active | v0.7.1 发布说明 |
| [pr-0.7.0.md](05-releases/pr-0.7.0.md) | active | v0.7.0 发布说明 |

### 02-harness/ — Harness Engineering

| 文档 | 状态 | 说明 |
|------|------|------|
| [overview.md](02-harness/overview.md) | active | 什么是 Harness Engineering ：前置控制、反馈控制、可驾驭性 |
| [feedforward.md](02-harness/feedforward.md) | active | 前置控制——引导层：AGENTS.md、Skills、架构文档、错误目录 |
| [feedback.md](02-harness/feedback.md) | active | 反馈控制——感知层：TypeScript、ESLint、Jest、CI 流水线 |

### 06-audits/ — 审计

| 文档 | 状态 | 说明 |
|------|------|------|

## 快速定位

| 我想知道… | 去哪看 |
|-----------|--------|
| 项目怎么跑起来 | [quick-start.md](00-getting-started/quick-start.md) |
| 本地环境如何搭建 | [environment-setup.md](01-guides/environment-setup.md) |
| Harness Engineering 是什么 | [02-harness/overview.md](02-harness/overview.md) |
| 系统架构全貌 | [project-architecture-overview.md](03-architecture/project-architecture-overview.md) |
| 一个 HTTP 请求经历了哪些阶段 | [request-pipeline.md](03-architecture/request-pipeline.md) |
| JWT 双令牌如何工作 | [auth-module.md](03-architecture/auth-module.md) |
| 路由装饰器怎么声明认证策略和错误码 | [route-decorator.md](03-architecture/route-decorator.md) |
| Swagger 文档如何自动富化 | [openapi-enrichment.md](03-architecture/openapi-enrichment.md) |
| 数据库连接池 / 慢查询监控 | [database.md](03-architecture/database.md) |
| 日志和请求追踪如何串联 | [observability.md](03-architecture/observability.md) |
| CI/CD 流水线和 Docker 部署 | [cicd-deployment.md](03-architecture/cicd-deployment.md) |
| AI 如何有效协助开发 | 根目录 [AGENTS.md](../AGENTS.md) |
| AI 文档操作流程 | [AGENTS.md](AGENTS.md) |
