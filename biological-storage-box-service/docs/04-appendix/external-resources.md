---
title: 参考资源
status: active
version: "0.7.3"
last-updated: 2026-04-09
category: reference
---

# 参考资源

这里汇集了两类资源：**项目 API 文档的访问入口**，以及**本项目所依赖的所有框架和库的官方文档**。

## API 文档

项目的交互式 API 文档由 **Scalar** 提供。根据你的使用场景选择合适的入口。

### 本地开发

先运行 `pnpm start:dev` 启动后端，然后访问：

| 工具 | 地址 | 说明 |
|------|------|------|
| **Scalar**（推荐）| [http://localhost:3000/reference](http://localhost:3000/reference) | 现代交互式 API 文档，可直接发送请求 |
| **Swagger UI** | [http://localhost:3000/api-doc](http://localhost:3000/api-doc) | 传统 Swagger 视图 |
| **OpenAPI JSON** | [http://localhost:3000/api-doc-json](http://localhost:3000/api-doc-json) | 原始 OpenAPI 规范 |

### 生产 / 文档站

文档站 prod 镜像（`Dockerfile.prod`）内嵌了 Scalar 静态页，无需后端运行即可查看：

| 工具 | 路径 | 说明 |
|------|------|------|
| **Scalar（内嵌）** | `/reference/api/` | 与文档站同镜像，离线可用 |
| **Apifox 托管** | [https://3f45oonrvv.apifox.cn](https://3f45oonrvv.apifox.cn) | dev 文档站链接目标 |

::: info API 文档是如何自动生成的？
本项目通过 `@ApiRoute` 装饰器自动生成丰富的 API 文档——认证策略标注、成功响应包络、错误码示例一应俱全，无需手动维护。详见[架构设计 → OpenAPI 增强](../03-architecture/openapi-enrichment)。
:::

## 框架与核心库

| 资源 | 链接 | 说明 |
|------|------|------|
| **NestJS** | [docs.nestjs.com](https://docs.nestjs.com/) | 核心框架，模块/守卫/拦截器/管道/过滤器等 |
| **Prisma** | [prisma.io/docs](https://www.prisma.io/docs/) | ORM 和数据库迁移，Schema 语法参考 |
| **Zod** | [zod.dev](https://zod.dev/) | Schema 验证，DTO 定义 |
| **VitePress** | [vitepress.dev](https://vitepress.dev/zh/) | 本文档站框架，Markdown 扩展语法 |

## 认证与安全

| 资源 | 链接 | 说明 |
|------|------|------|
| **nestjs-zod** | [github.com/BenLorantfy/nestjs-zod](https://github.com/BenLorantfy/nestjs-zod) | Zod 与 NestJS 集成，DTO 生成与校验管道 |
| **@nestjs/jwt** | [docs.nestjs.com/security/authentication](https://docs.nestjs.com/security/authentication) | JWT 模块集成 |
| **Helmet** | [helmetjs.github.io](https://helmetjs.github.io/) | HTTP 安全响应头 |
| **@nestjs/throttler** | [docs.nestjs.com/security/rate-limiting](https://docs.nestjs.com/security/rate-limiting) | 限流守卫配置 |

## 可观测性

| 资源 | 链接 | 说明 |
|------|------|------|
| **nestjs-pino** | [github.com/iamolegga/nestjs-pino](https://github.com/iamolegga/nestjs-pino) | NestJS Pino 日志集成 |
| **Pino** | [getpino.io](https://getpino.io/) | 底层 JSON 日志库 |

## 构建与工程化

| 资源 | 链接 | 说明 |
|------|------|------|
| **pnpm** | [pnpm.io](https://pnpm.io/zh/) | 包管理器，Workspace 配置 |
| **TypeScript** | [typescriptlang.org](https://www.typescriptlang.org/docs/) | 语言参考，`tsconfig` 字段说明 |
| **tsc-alias** | [github.com/justkey007/tsc-alias](https://github.com/justkey007/tsc-alias) | 编译后路径别名替换 |
| **dotenvx** | [dotenvx.com](https://dotenvx.com/) | 加密环境变量管理 |
| **Scalar** | [scalar.com](https://scalar.com/) | API Reference UI，内嵌于文档站 |
