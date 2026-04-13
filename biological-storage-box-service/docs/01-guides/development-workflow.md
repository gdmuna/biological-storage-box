---
title: 开发工作流
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: guide
---

# 开发工作流

本文档描述日常开发的完整工作流，从建立特性分支到代码合并。分支策略与提交规范的完整说明见[贡献指南](./contributing)。

## 日常开发流程

### 1. 从 `dev` 分支创建特性分支

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
```

::: tip 命名格式
`feature/<描述>`，描述使用小写连字符，例如 `feature/user-profile-api`。
:::

### 2. 开发与自测

启动开发服务器（支持热重载）：

```bash
pnpm start:dev
```

在开发过程中随时运行 lint：

```bash
pnpm lint:fix   # 自动修复大部分 lint 问题
pnpm format     # Prettier 格式化
```

### 3. 编写测试

本项目遵循**测试驱动开发（TDD）**原则，业务逻辑变更必须附带测试：

- 新增 Service 方法 → 在 `test/unit/` 对应文件编写单元测试
- 新增 API 端点 → 在 `test/e2e/` 编写 E2E 测试

```bash
# 运行测试（需要数据库连接）
pnpm test

# 监听模式（开发时常用）
pnpm test:watch
```

### 4. 提交前检查

```bash
# 完整验证序列（与 CI 一致）
pnpm lint       # 零错误
pnpm build      # 编译通过
pnpm test       # 测试通过
```

### 5. 提交代码

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```bash
git add .
git commit -m "feat(auth): add password strength validation"
```

常用提交类型：`feat` / `fix` / `docs` / `refactor` / `test` / `ci` / `chore`

### 6. 推送并创建 PR

```bash
git push origin feature/my-feature
```

在 GitHub 上发起 PR，目标分支为 `dev`，`pr-check-dev.yaml` 会自动运行 lint + test 验证。

## 添加新模块

### 标准目录结构

```
src/modules/my-feature/
├── my-feature.controller.ts   # 路由声明与 HTTP 响应
├── my-feature.service.ts      # 业务逻辑
├── my-feature.repository.ts   # 数据访问（Prisma 查询）
├── my-feature.module.ts       # 模块注册
└── dto/
    ├── create-my-feature.dto.ts
    └── my-feature-response.dto.ts
```

### 注册新模块

在 `src/modules/index.ts` 中导出，在 `src/app.module.ts` 的 `imports` 中添加。

### 路由声明规范

使用 `@ApiRoute` 装饰器声明认证策略和错误码（会自动富化 OpenAPI 文档）：

```typescript
import { ApiRoute } from '@/common/decorators/route.decorator.js';

@Controller('my-feature')
export class MyFeatureController {
    @Get()
    @ApiRoute({
        summary: '获取列表',
        auth: 'required',      // 'public' | 'optional' | 'required'
        responseType: MyFeatureResponseDto,
        errors: ['DB_RECORD_NOT_FOUND'],
    })
    async getList(@Request() req: ExpressRequest) {
        return this.myFeatureService.getList(req.jwtClaim!.sub);
    }
}
```

### 抛出业务异常

```typescript
import { DuplicateUserException } from '@/common/exceptions/index.js';

// 在 Service 中
if (existing) {
    throw new DuplicateUserException();
}

// 或使用 to() 包装异步操作
import { to } from '@/common/utils/errors/async-result.js';

const [err, user] = await to(this.userRepository.findById(id));
if (err) throw new DatabaseQueryException({ cause: err });
```

## 数据库变更

涉及 Prisma schema 变更时：

```bash
# 1. 修改 prisma/schema.prisma

# 2. 生成迁移文件
pnpm db:migrate   # 会提示你命名迁移

# 3. 重新生成 Prisma Client 类型
pnpm db:gen-client

# 4. 验证受影响的 Service 和 DTO 与新 schema 一致
pnpm build
```

## 常见问题

### 路径别名无法解析

检查 `tsconfig.json` 中是否有 `paths` 配置：
```json
{
  "paths": {
    "@/*": ["src/*"],
    "@root/*": ["./*"]
  }
}
```

编译后路径替换由 `tsc-alias` 处理（见 `package.json` scripts）。

### Prisma Client 类型不匹配

运行 `pnpm db:gen-client` 重新生成。如果问题持续，检查 `prisma.config.ts` 中的 `output` 路径是否指向 `prisma/generated/`。

### E2E 测试数据库连接失败

确认 `.env.test` 中的 `DATABASE_URL` 指向已存在的测试数据库，且 PostgreSQL 实例正在运行。详见[测试指南](./testing)。

## 接下来做什么？

- [测试指南](./testing) — 单元测试、E2E 测试的编写规范和运行方式
- [贡献指南](./contributing) — 分支策略、提交规范、发布流程
- [Harness Engineering — 感知层](../02-harness/feedback) — 理解 lint / build / test 组成的反馈闭环
