---
title: 测试指南
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: guide
---

# 测试指南

本项目采用两层测试策略：**单元测试**（mock 依赖，验证业务逻辑）和 **E2E 测试**（真实数据库，验证 API 契约）。

## 测试架构

```
test/
├── unit/                         # 单元测试
│   ├── app.controller.spec.ts
│   ├── app.service.spec.ts
│   ├── auth.controller.spec.ts
│   ├── auth.guard.spec.ts
│   └── auth.service.spec.ts
└── e2e/                          # E2E 测试
    ├── app.e2e-spec.ts
    └── auth.e2e-spec.ts
```

单元测试和 E2E 测试在**同一 Jest 进程**中运行（见 `jest.config.js`）。

## 运行测试

### 前置条件

E2E 测试需要真实数据库连接。确保：

1. PostgreSQL 实例正在运行
2. `.env.test` 中的 `DATABASE_URL` 指向有效的测试数据库
3. 测试数据库已运行过迁移（`pnpm db:migrate`）

```bash
# 使用 Docker 快速启动测试数据库
docker run -d --name pg-test \
  -p 5433:5432 \
  -e POSTGRES_USER=ci_test \
  -e POSTGRES_PASSWORD=ci_test \
  -e POSTGRES_DB=nestjs_demo_basic_test \
  postgres:18
```

### 常用命令

```bash
# 运行全部测试（单元 + E2E）
pnpm test

# 监听模式（修改代码后自动重跑）
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov

# 运行指定测试文件
pnpm test auth.service
```

## 单元测试

单元测试使用 Jest mock 隔离依赖，**不需要数据库连接**。

### 典型结构

```typescript
// test/unit/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/auth/auth.service.js';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    // mock Repository 层，不连接真实数据库
                    provide: UserRepository,
                    useValue: {
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: PinoLogger,
                    useValue: { error: jest.fn(), info: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should throw AUTH_CREDENTIALS_INVALID when password is wrong', async () => {
        // mock 返回用户，但密码不匹配
        jest.spyOn(userRepo, 'findByEmail').mockResolvedValue(mockUser);

        await expect(
            service.login({ email: 'test@test.com', password: 'wrong' })
        ).rejects.toMatchObject({ code: 'AUTH_CREDENTIALS_INVALID' });
    });
});
```

### 测试重点

优先覆盖：
- **分支逻辑**（if/else 条件判断，业务规则路径）
- **边界条件**（空值、重复数据、数量上限等）
- **异常路径**（抛出正确的异常类型和错误码）

## E2E 测试

E2E 测试使用 Supertest 向真实运行的 NestJS 应用发送 HTTP 请求，验证完整的请求响应链路。

### 典型结构

```typescript
// test/e2e/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module.js';

describe('Auth (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ username: 'testuser', email: 'test@example.com', password: 'Password123!' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
        });

        it('should return 409 for duplicate email', async () => {
            // 先注册
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ username: 'user2', email: 'dup@example.com', password: 'Password123!' });

            // 再次注册同邮箱
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ username: 'user3', email: 'dup@example.com', password: 'Password123!' });

            expect(res.status).toBe(409);
            expect(res.body.code).toBe('AUTH_USER_DUPLICATE');
        });
    });
});
```

### E2E 测试设计规范

- **无状态**：每个测试套件（`describe`）不依赖其他套件的执行结果
- **数据隔离**：使用唯一的邮箱/用户名（可加随机后缀），或在 `afterEach` 中清理数据
- **不 mock 外部依赖**：E2E 测试验证的是完整链路，包括数据库操作

## 测试连接 CI 流水线

CI 中的 E2E 测试配置（见 `.github/workflows/ci-reusable.yaml`）：

- PostgreSQL 健康检查使用 `pg_isready -U ci_test -d nestjs_demo_basic_test`
- `start-period 30s` 留足初始化时间
- 连接 URL 使用 `127.0.0.1`（避免 IPv6 优先解析问题）

## 覆盖率

```bash
pnpm test:cov
```

覆盖率报告输出到 `coverage/` 目录。本项目不追求固定覆盖率数字，但应覆盖：
- 所有 Service 的核心业务逻辑分支
- 所有公开 API 端点的正常路径和主要错误路径

## 接下来做什么？

- [开发工作流](./development-workflow) — 完整的提交前验证序列
- [Harness Engineering — 感知层](../02-harness/feedback) — 理解测试在 CI 闭环中的位置
- [异常体系设计](../03-architecture/exception-system) — 了解如何用错误码写出更精准的断言
