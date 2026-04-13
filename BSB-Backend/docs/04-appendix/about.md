---
title: 关于本项目
status: active
version: "0.7.4"
last-updated: 2026-04-11
category: guide
---

# 关于本项目

这个页面记录了一些在主文档里不属于任何一节的背景信息：谁在维护这个项目、应该如何参与共建，以及对所有支撑这个项目的开源作者和社区的感谢。

## Maintainers

本项目由以下成员发起与维护：

| 角色 | 成员 | 主要职责 |
|------|------|---------|
| 项目发起人 | [@Maiturin](https://github.com/Maiturin) | 架构设计、核心实现、文档体系 |

欢迎通过 [GitHub Issues](https://github.com/gdmuna/NestJS-Scaffold/issues) 反馈问题，或阅读[贡献指南](/guide/contributing)参与共建。

## 致谢

本项目站在以下优秀开源项目的肩膀上构建，向它们的作者和社区致以诚挚的感谢。

### 核心框架

> 以下是本项目最核心的依赖，项目的整体骨架由它们共同支撑。

**[NestJS](https://nestjs.com)** 是本项目的基础框架，提供了模块化 IoC 容器、装饰器体系与完整的 AOP 机制。本项目的认证、日志、异常处理等所有横切关注点，都通过 NestJS 的守卫、拦截器、过滤器来实现。

<!-- **[Fastify](https://fastify.dev)** 作为底层 HTTP 运行时（通过 `@nestjs/platform-fastify`），替代默认的 Express 带来了更好的性能表现。 -->

**[Prisma](https://www.prisma.io)** 为项目提供了类型安全的 ORM 与数据库迁移工具，`@prisma/adapter-pg` 使其能直接对接原生 `pg` 连接池，兼顾灵活性与性能。

**[TypeScript](https://www.typescriptlang.org)** 以 `strict` + ESM + `nodenext` 模式运行，是本项目类型安全的基础。

### 认证与安全

- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — 密码哈希与验证
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — JWT 签发与验证（ES256 非对称密钥）
<!-- - **[Passport.js](https://www.passportjs.org)** — 认证策略中间件基础 -->
- **[Helmet](https://helmetjs.github.io)** — HTTP 安全响应头（CSP、HSTS 等）
- **[@nestjs/throttler](https://github.com/nestjs/throttler)** — 全局限流保护
- **[cookie-parser](https://github.com/expressjs/cookie-parser)** — Refresh Token HttpOnly Cookie 解析
- **[compression](https://github.com/expressjs/compression)** — HTTP 响应压缩

### 校验与文档

- **[Zod](https://zod.dev)** — 运行时 Schema 验证，配合 [nestjs-zod](https://github.com/BFF255/nestjs-zod) 实现 NestJS 管道与 DTO 的类型安全绑定
- **[@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)** — OpenAPI 规范生成，本项目通过 `@ApiRoute` 装饰器对其进行了自动富化封装
- **[Scalar](https://scalar.com)** (`@scalar/nestjs-api-reference`) — 替代 Swagger UI 的交互式 API 文档界面

### 日志与可观测性

- **[Pino](https://getpino.io)** — 高性能结构化 JSON 日志，通过 [nestjs-pino](https://github.com/iamolegga/nestjs-pino) 与 [pino-http](https://github.com/pinojs/pino-http) 集成，开发环境通过 [pino-pretty](https://github.com/pinojs/pino-pretty) 输出可读日志

### 数据库与运行时

- **[PostgreSQL](https://www.postgresql.org)** — 主数据库
- **[pg](https://node-postgres.com)** — Node.js PostgreSQL 原生驱动
- **[ulid](https://github.com/ulid/javascript)** — 生成时间有序的唯一请求 ID（替代 UUID）
- **[lodash](https://lodash.com)** — 通用工具函数
- **[rxjs](https://rxjs.dev)** — NestJS 内部响应流基础（随框架引入）
- **[reflect-metadata](https://rbuckton.github.io/reflect-metadata/)** — TypeScript 装饰器元数据支持

### 工程与工具链

- **[dotenvx](https://dotenvx.com)** (`@dotenvx/dotenvx-ops`) — 多环境 `.env` 管理与加密，消除敏感配置硬编码风险
- **[pnpm](https://pnpm.io)** — 高效包管理与 monorepo 工作区协作
- **[Husky](https://typicode.github.io/husky/)** + **[lint-staged](https://github.com/lint-staged/lint-staged)** — Git commit 钩子，自动触发 lint 与格式化
- **[ESLint](https://eslint.org)** + **[@typescript-eslint](https://typescript-eslint.io)** — 静态代码分析
- **[Prettier](https://prettier.io)** — 代码格式化
- **[Jest](https://jestjs.io)** + **[Supertest](https://github.com/ladjs/supertest)** + **[ts-jest](https://kulshekhar.github.io/ts-jest/)** — 单元测试与 E2E 测试
- **[tsx](https://github.com/privatenumber/tsx)** — TypeScript 脚本直接执行（用于构建脚本）
- **[tsc-alias](https://github.com/justkey007/tsc-alias)** — 编译后路径别名替换
- **[figlet](https://github.com/patorjk/figlet.js)** + **[gradient-string](https://github.com/bokub/gradient-string)** — 启动时彩色 ASCII Banner

### 文档站

- **[VitePress](https://vitepress.dev)** — 静态文档站构建工具，驱动你正在阅读的这份文档
- **[@mdit/plugin-tasklist](https://mdit-plugins.github.io/tasklist.html)** — Markdown-it 任务列表插件（`- [ ]` / `- [x]`）
- **[vitepress-mermaid-renderer](https://github.com/emersonbottero/vitepress-plugin-mermaid)** — 文档内 Mermaid 图表渲染

### 图片素材

- 文档站首页 Logo 由 **[@AnwarAchilles](https://github.com/AnwarAchilles)** 创作，基于 [CC BY-NC-SA 4.0](https://raw.githubusercontent.com/AnwarAchilles/VTuber-Style-Logos/main/LICENSE) 协议分发。

## 声明

本项目为社区维护的开源模板，**与 NestJS 官方团队无关联**。

项目基于 [MIT 许可证](https://github.com/gdmuna/NestJS-Scaffold/blob/main/LICENSE) 开源，可自由用于个人或商业项目。

