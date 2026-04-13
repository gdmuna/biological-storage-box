# BSB Monorepo 全面重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成三项串行工程：①工作区重命名为 BSB-* ②后端实现 53 个 API 端点（严格 TDD）③前端全面重写为 shadcn-vue + alova + Pinia + zod + gsap。

**Architecture:** 串行三阶段。Phase 1 原子重命名后，Phase 2 按依赖树顺序逐模块实现（Prisma Model → Repository → Service → Controller → Tests），Phase 3 全量重写前端（Design System → 布局 → 页面 → 动效）。架构决策详见 `docs/plans/2026-04-13-bsb-mega-refactor.md`。

**Tech Stack:** NestJS + Prisma + PostgreSQL（后端）；Vue3 + **TypeScript 6**（兼容问题无法解决时回退 TypeScript 5）+ Pinia + shadcn-vue + alova v3 + Tailwind CSS v3 + gsap + zod（前端）。

> **TypeScript 版本策略：** 前端优先使用 TypeScript 6。若在 Vue SFC、shadcn-vue 组件、alova 类型推断等场景中遇到无法合理解决的兼容问题，允许降级至 TypeScript 5.x。决策需在 commit message 中注明原因。

---

## PHASE 1 — 工作区重命名

### Task 1: 重命名工作区目录并更新所有配置引用

**目标：** 将三个工作区从 `biological-storage-box-*` 重命名为 `BSB-*`

**Files:**
- Rename: `biological-storage-box-service/` → `BSB-Backend/`
- Rename: `biological-storage-box-docs/` （VitePress 站）→ `BSB-Docsite/`
- Rename: `biological-storage-box-web/` → `BSB-Frontend/`
- Modify: `pnpm-workspace.yaml`
- Modify: `BSB-Backend/package.json` — name 字段
- Modify: `BSB-Docsite/package.json` — name 字段
- Modify: `BSB-Frontend/package.json` — name 字段
- Modify: `docker-compose.yml` — volumes、build.context
- Modify: `BSB-Backend/Dockerfile` — COPY 路径（如有绝对路径）
- Modify: `.github/workflows/ci.yml` — filter.paths、--filter 参数
- Modify: `.github/workflows/release.yml` — --filter 参数（如有）
- Modify: `.github/copilot-instructions.md` — 所有路径引用
- Modify: `.husky/pre-commit` — grep 路径前缀
- Modify: 根 `package.json` — scripts 中的 --filter 参数
- Modify: `BSB-Docsite` vitepress config — srcDir 路径

**Step 1: 重命名目录**

```bash
# 在 monorepo 根目录执行
git mv biological-storage-box-service BSB-Backend
git mv biological-storage-box-web BSB-Frontend
# 如果存在 docs 站独立目录
# git mv biological-storage-box-docs BSB-Docsite
```

> 注意：VitePress 站可能内嵌在 BSB-Backend/website/，检查后决定是否需要 mv。

**Step 2: 更新 pnpm-workspace.yaml**

```yaml
# pnpm-workspace.yaml
packages:
  - 'BSB-Backend'
  - 'BSB-Docsite'
  - 'BSB-Frontend'
```

**Step 3: 更新各 package.json name 字段**

- `BSB-Backend/package.json`: `"name": "BSB-Backend"`
- `BSB-Docsite/package.json`: `"name": "BSB-Docsite"` （如果存在）
- `BSB-Frontend/package.json`: `"name": "BSB-Frontend"`

**Step 4: 更新根 package.json scripts**

将所有 `--filter biological-storage-box-service` 替换为 `--filter BSB-Backend`；同理更新 web 和 docs。

**Step 5: 更新 .husky/pre-commit**

将 grep 路径前缀从 `biological-storage-box-service/` 和 `biological-storage-box-web/` 替换为 `BSB-Backend/` 和 `BSB-Frontend/`。

**Step 6: 更新 docker-compose.yml**

检查 `volumes` 和 `build.context` 中的路径，将 `./biological-storage-box-service` 替换为 `./BSB-Backend`。

**Step 7: 更新 CI workflows**

在 `.github/workflows/` 中搜索所有 `biological-storage-box-*` 引用，替换为对应 `BSB-*` 名称。

**Step 8: 更新 copilot-instructions.md**

更新 `.github/copilot-instructions.md` 中所有路径文档引用。

**Step 9: 重新安装依赖验证**

```bash
pnpm install
```

Expected: lockfile 更新，无错误。

**Step 10: 验证格式检查**

```bash
pnpm run format:check
```

Expected: 通过（无格式错误）。

**Step 11: 验证后端构建**

```bash
pnpm --filter BSB-Backend build
```

Expected: 编译成功，无 TypeScript 错误。

**Step 12: Commit**

```bash
git add -A
git commit -m "chore(monorepo): rename workspaces to BSB-* prefix"
```

---

## PHASE 2 — 后端 API 实现

> **前置要求：** Phase 1 完成，工作区目录为 `BSB-Backend/`。
>
> **架构约定（每个模块都必须遵守）：**
> - Controller 仅处理 HTTP：解析参数、调用 Service、返回结果
> - Service 含业务逻辑：参数校验、权限判断、数据组装
> - Repository 仅做数据访问：封装 Prisma 调用
> - 所有受保护端点使用 `@ApiRoute({ auth: 'jwt' })` 装饰器
> - 业务异常通过 `BusinessException` + errorRegistry 抛出
> - 单元测试 mock Repository（`jest.fn()`），单独验证 Service 逻辑
> - E2E 测试使用 supertest + 真实测试数据库

### Task 2: 扩展 Prisma Schema

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`
- Create: `BSB-Backend/prisma/migrations/...` （自动生成）

**Step 1: 添加所有业务 Model**

在 `schema.prisma` 中追加以下 Model（在现有 `User` 之后）：

```prisma
model Organization {
  id          String   @id @default(ulid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner       User               @relation("OrgOwner", fields: [ownerId], references: [id])
  members     OrganizationUser[]
  roots       Root[]
  boxes       Box[]

  @@index([ownerId])
}

model OrganizationUser {
  id        String   @id @default(ulid())
  orgId     String
  userId    String
  role      OrgRole  @default(MEMBER)
  status    OrgUserStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([orgId, userId])
  @@index([userId])
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

enum OrgUserStatus {
  PENDING    // 申请中 / 邀请中
  ACTIVE     // 已加入
  REJECTED   // 已拒绝
}

model Root {
  id          String   @id @default(ulid())
  orgId       String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  org         Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  boxes       Box[]

  @@index([orgId])
}

model Box {
  id          String   @id @default(ulid())
  orgId       String
  rootId      String?
  name        String
  description String?
  rows        Int      @default(9)
  cols        Int      @default(9)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  org         Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  root        Root?        @relation(fields: [rootId], references: [id], onDelete: SetNull)
  aliases     BoxAlias[]
  images      BoxImage[]
  logs        BoxLog[]
  reagents    Reagent[]

  @@index([orgId])
  @@index([rootId])
}

model BoxAlias {
  id        String   @id @default(ulid())
  boxId     String
  alias     String
  createdAt DateTime @default(now())

  box       Box @relation(fields: [boxId], references: [id], onDelete: Cascade)

  @@index([boxId])
}

model BoxImage {
  id        String   @id @default(ulid())
  boxId     String
  imageUrl  String
  createdAt DateTime @default(now())

  box       Box @relation(fields: [boxId], references: [id], onDelete: Cascade)

  @@index([boxId])
}

model BoxLog {
  id            String   @id @default(ulid())
  boxId         String
  userId        String
  operationType String
  detail        String?
  createdAt     DateTime @default(now())

  box           Box  @relation(fields: [boxId], references: [id], onDelete: Cascade)
  user          User @relation(fields: [userId], references: [id])

  @@index([boxId])
  @@index([userId])
}

model Reagent {
  id          String   @id @default(ulid())
  boxId       String
  orgId       String
  position    String   // e.g. "A1", "B3"
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  box         Box          @relation(fields: [boxId], references: [id], onDelete: Cascade)
  logs        BoxLog[]     // 通过 reagentId 关联（可选扩展）

  @@index([boxId])
  @@index([orgId])
}

model Feedback {
  id        String   @id @default(ulid())
  userId    String
  content   String
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

同时更新 `User` 模型，添加反向关系字段：

```prisma
model User {
  // ... 现有字段 ...

  ownedOrgs    Organization[]    @relation("OrgOwner")
  orgMemberships OrganizationUser[]
  boxLogs      BoxLog[]
  feedbacks    Feedback[]
}
```

**Step 2: 运行数据库迁移**

```bash
pnpm --filter BSB-Backend db:migrate
# 输入迁移名称：add_business_models
```

Expected: 迁移文件生成，数据库 schema 更新成功。

**Step 3: 重新生成 Prisma Client**

```bash
pnpm --filter BSB-Backend db:gen-client
```

Expected: `prisma/generated/` 目录更新，无错误。

**Step 4: 验证编译**

```bash
pnpm --filter BSB-Backend build
```

Expected: 编译通过。

**Step 5: Commit**

```bash
git add BSB-Backend/prisma/
git commit -m "chore(backend): expand prisma schema for all business models"
```

---

### Task 3: user 模块（用户信息管理）

**端点：**
- `GET /user/info` — 当前用户信息（JWT）
- `PUT /user/update/info` — 修改个人信息
- `PUT /user/update/password` — 修改密码（需旧密码）
- `GET /user/email/code` — 发送邮箱验证码
- `POST /user/email/login` — 邮箱验证码登录
- `PUT /user/update/email` — 修改邮箱（需验证码）
- `PUT /user/email/update/password` — 邮箱验证码修改密码
- `GET /user/search` — 搜索用户

**Files:**
- Create: `BSB-Backend/src/modules/user/user.module.ts`
- Create: `BSB-Backend/src/modules/user/user.controller.ts`
- Create: `BSB-Backend/src/modules/user/user.service.ts`
- Create: `BSB-Backend/src/modules/user/user.repository.ts`
- Create: `BSB-Backend/src/modules/user/user.dto.ts`
- Modify: `BSB-Backend/src/modules/index.ts`
- Modify: `BSB-Backend/src/app.module.ts`
- Create: `BSB-Backend/test/unit/user/user.service.spec.ts`
- Create: `BSB-Backend/test/e2e/user/user.e2e-spec.ts`

**Step 1: 写 Service 单元测试（先写，先失败）**

```typescript
// test/unit/user/user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: { findById: jest.fn(), findByEmail: jest.fn(), update: jest.fn(), search: jest.fn() } },
      ],
    }).compile();
    service = module.get(UserService);
    repo = module.get(UserRepository);
  });

  it('getMyInfo: should return user info', async () => {
    repo.findById.mockResolvedValue({ id: '1', username: 'test', email: 'a@b.com', nickname: null, realname: null } as any);
    const result = await service.getMyInfo('1');
    expect(result).toMatchObject({ id: '1', username: 'test' });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('updateInfo: should update nickname and realname', async () => {
    repo.update.mockResolvedValue({ id: '1', nickname: 'new', realname: 'real' } as any);
    const result = await service.updateInfo('1', { nickname: 'new', realname: 'real' });
    expect(repo.update).toHaveBeenCalledWith('1', { nickname: 'new', realname: 'real' });
    expect(result.nickname).toBe('new');
  });

  it('searchUsers: should return list excluding self', async () => {
    repo.search.mockResolvedValue([{ id: '2', username: 'other' }] as any);
    const result = await service.searchUsers('other', '1');
    expect(result.every(u => u.id !== '1')).toBe(true);
  });
});
```

**Step 2: 运行测试，验证失败**

```bash
pnpm --filter BSB-Backend test -- --testPathPattern="user.service.spec"
```

Expected: FAIL（UserService 不存在）

**Step 3: 创建 UserRepository**

```typescript
// src/modules/user/user.repository.ts
@Injectable()
export class UserRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async update(id: string, data: Partial<{ nickname: string; realname: string; email: string; passwordHash: string }>) {
    return this.db.user.update({ where: { id }, data });
  }

  async search(keyword: string, limit = 10) {
    return this.db.user.findMany({
      where: {
        OR: [
          { username: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { nickname: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, username: true, nickname: true, email: true },
    });
  }
}
```

**Step 4: 创建 UserService**

实现 `getMyInfo`、`updateInfo`、`updatePassword`（验旧密 + bcrypt 哈希）、`searchUsers`。邮箱相关端点（code/login/update）复用 `AlsService` 或新建 `EmailVerificationService`（可 mock 实现，stub 发送邮件）。

**Step 5: 运行单元测试，验证通过**

```bash
pnpm --filter BSB-Backend test -- --testPathPattern="user.service.spec"
```

Expected: PASS

**Step 6: 创建 UserController 和 UserDto**

```typescript
// src/modules/user/user.dto.ts
export class UpdateUserInfoDto {
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsString() realname?: string;
}

export class UpdatePasswordDto {
  @IsString() oldPassword: string;
  @IsString() @MinLength(8) newPassword: string;
}
// ... 其余 DTO
```

```typescript
// src/modules/user/user.controller.ts
@Controller('user')
export class UserController {
  @ApiRoute({ auth: 'jwt', summary: '获取当前用户信息' })
  @Get('info')
  async getMyInfo(@CurrentUser() user: JwtPayload) {
    return this.userService.getMyInfo(user.sub);
  }
  // ... 其余端点
}
```

**Step 7: 写 E2E 测试**

```typescript
// test/e2e/user/user.e2e-spec.ts
describe('/user (E2E)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    // 创建测试用户，获取 JWT token
  });

  it('GET /user/info → 200 with user object', async () => {
    return request(app.getHttpServer())
      .get('/user/info')
      .set('Cookie', `accessToken=${token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).not.toHaveProperty('passwordHash');
      });
  });

  it('PUT /user/update/info → 200', async () => {
    return request(app.getHttpServer())
      .put('/user/update/info')
      .set('Cookie', `accessToken=${token}`)
      .send({ nickname: 'TestNick' })
      .expect(200);
  });
});
```

**Step 8: 运行全量测试**

```bash
pnpm --filter BSB-Backend test
```

Expected: 全部通过（包括已有 auth 测试）。

**Step 9: Commit**

```bash
git add BSB-Backend/src/modules/user/ BSB-Backend/test/unit/user/ BSB-Backend/test/e2e/user/
git commit -m "feat(backend): implement user profile and search endpoints"
```

---

### Task 4: file 模块（文件上传）

**端点：**
- `POST /file/upload` — 文件上传（multipart/form-data，返回 URL）

**Files:**
- Create: `BSB-Backend/src/modules/file/file.module.ts`
- Create: `BSB-Backend/src/modules/file/file.controller.ts`
- Create: `BSB-Backend/src/modules/file/file.service.ts`
- Create: `BSB-Backend/test/e2e/file/file.e2e-spec.ts`

**Step 1: 检查现有 StorageService**

```bash
ls BSB-Backend/src/infra/storage/
```

如已存在 StorageService，复用；否则创建 stub（直接返回假 URL，在注释中标记 `// TODO: connect real storage`）。

**Step 2: 创建 FileController**

```typescript
@Controller('file')
export class FileController {
  @ApiRoute({ auth: 'jwt', summary: '文件上传' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.upload(file);
  }
}
```

**Step 3: 写 E2E 测试**

测试上传一个小 PNG buffer，验证返回包含 url 字段。

**Step 4: 运行测试，Commit**

```bash
git commit -m "feat(backend): implement file upload endpoint"
```

---

### Task 5: org 模块（组织管理）

**端点：**
- `POST /org/create`
- `DELETE /org/del`
- `GET /org/one`
- `GET /org/list`
- `GET /org/search`
- `PUT /org/update`

**Files:**
- Create: `BSB-Backend/src/modules/org/org.module.ts`
- Create: `BSB-Backend/src/modules/org/org.controller.ts`
- Create: `BSB-Backend/src/modules/org/org.service.ts`
- Create: `BSB-Backend/src/modules/org/org.repository.ts`
- Create: `BSB-Backend/src/modules/org/org.dto.ts`
- Create: `BSB-Backend/test/unit/org/org.service.spec.ts`
- Create: `BSB-Backend/test/e2e/org/org.e2e-spec.ts`

**Step 1: 单元测试（先写）**

重点测试：创建组织时自动将创建者加为 OWNER 成员；删除组织前验证操作者是 OWNER；搜索按 name 模糊匹配。

**Step 2: 实现 OrgRepository → OrgService → OrgController**

`create` 在事务中同时创建 `Organization` + `OrganizationUser(OWNER)`。

**Step 3: E2E 测试覆盖全部 6 个端点**

**Step 4: 运行测试，Commit**

```bash
git commit -m "feat(backend): implement org CRUD endpoints"
```

---

### Task 6: org/user 模块（组织成员管理）

**端点（9 个）：**
- `POST /org/user/apply` — 申请加入
- `POST /org/user/apply/ac` — 管理员接受申请
- `POST /org/user/apply/ms` — 管理员拒绝申请
- `DELETE /org/user/del` — 移除成员
- `POST /org/user/invite` — 邀请用户
- `POST /org/user/invite/ac` — 用户接受邀请
- `POST /org/user/invite/ms` — 用户拒绝邀请
- `GET /org/user/list` — 申请/邀请列表（待处理）
- `GET /org/user/member/list` — 已加入成员列表
- `DELETE /org/user/quit` — 退出组织
- `PUT /org/user/updateAuthority` — 修改成员权限

**Files:**
- Create: `BSB-Backend/src/modules/org/org-user.controller.ts`
- Create: `BSB-Backend/src/modules/org/org-user.service.ts`
- Modify: `BSB-Backend/src/modules/org/org.module.ts`
- Create: `BSB-Backend/test/unit/org/org-user.service.spec.ts`
- Create: `BSB-Backend/test/e2e/org/org-user.e2e-spec.ts`

**Step 1: 单元测试重点场景**

- `apply`: 已是成员时抛 BusinessException
- `del`: 操作者非 OWNER/ADMIN 时抛 BusinessException
- `quit`: OWNER 不能退出（必须先转让）
- `updateAuthority`: 不能提升他人为 OWNER

**Step 2: 实现 OrgUserService**

所有状态变更通过 `db.organizationUser.update({ status/role })` 完成。

**Step 3: E2E + Commit**

```bash
git commit -m "feat(backend): implement org user management endpoints"
```

---

### Task 7: root 模块（房间/位置管理）

**端点（5 个）：**
- `POST /root/add`
- `DELETE /root/del`
- `GET /root/list`
- `GET /root/one`
- `PUT /root/update`

**Files:**
- Create: `BSB-Backend/src/modules/root/` (module/controller/service/repository/dto)
- Create: `BSB-Backend/test/unit/root/` + `test/e2e/root/`

**Step 1: 所有操作验证用户在指定 org 内有权限（OWNER 或 ADMIN）**

**Step 2: 实现并测试，Commit**

```bash
git commit -m "feat(backend): implement root location CRUD endpoints"
```

---

### Task 8: box 模块（储存盒 CRUD）

**端点（8 个）：**
- `POST /box/add`
- `DELETE /box/del`
- `GET /box/list`
- `GET /box/one`
- `GET /box/root/list` — 按 root 分组的盒子列表
- `GET /box/search`
- `PUT /box/update`

**Files:**
- Create: `BSB-Backend/src/modules/box/` (module/controller/service/repository/dto)
- Create: `BSB-Backend/test/unit/box/` + `test/e2e/box/`

**Step 1: Box 有 rows/cols 字段表示储存格数量（默认 9×9）**

**Step 2: `/box/root/list` 返回按 Root 分组的数据结构**

```typescript
// 返回结构示例
[
  { rootId: '...', rootName: '...', boxes: [ {...}, {...} ] }
]
```

**Step 3: Commit**

```bash
git commit -m "feat(backend): implement box CRUD endpoints"
```

---

### Task 9: box/alias 模块

**端点（4 个）：**
- `POST /box/alias/add`
- `DELETE /box/alias/del`
- `GET /box/alias/list`
- `PUT /box/alias/update`

**Files:**
- Create: `BSB-Backend/src/modules/box/box-alias.controller.ts`
- Create: `BSB-Backend/src/modules/box/box-alias.service.ts`
- Modify: `BSB-Backend/src/modules/box/box.module.ts`

**Step 1: alias 属于 box，所有操作先验证 box 存在且用户有权限**

**Step 2: Commit**

```bash
git commit -m "feat(backend): implement box alias management"
```

---

### Task 10: box/image 模块

**端点（3 个）：**
- `POST /box/image/add` — 添加盒子图片（提供文件 URL）
- `GET /box/image/list`
- `POST /box/image/compare` — 比对两张图片（可 mock 实现，返回 stub diff）

**Files:**
- Create: `BSB-Backend/src/modules/box/box-image.controller.ts`
- Create: `BSB-Backend/src/modules/box/box-image.service.ts`

**Step 1: compare 端点 stub 实现（调用自定义 ImageCompareService，默认返回 `{ similar: true, confidence: 0.95 }`）**

标注 `// TODO: 接入真实图像比对算法`。

**Step 2: Commit**

```bash
git commit -m "feat(backend): implement box image management"
```

---

### Task 11: reagent 模块

**端点（3 个）：**
- `GET /reagent/list`
- `GET /reagent/one`
- `PUT /reagent/update`

> 注意：原 OpenAPI 中 tag 为"试剂"，entity 为 `ReagenOperateVO`，意为储存盒内的试剂位置信息。

**Files:**
- Create: `BSB-Backend/src/modules/reagent/` (module/controller/service/repository/dto)
- Create: `BSB-Backend/test/unit/reagent/` + `test/e2e/reagent/`

**Step 1: Reagent 关联到 Box，list 需要 boxId 参数**

**Step 2: Commit**

```bash
git commit -m "feat(backend): implement reagent endpoints"
```

---

### Task 12: box/log + feedback 模块

**端点（3 个）：**
- `GET /box/log/list` — 盒子操作日志
- `GET /box/log/reagen/list` — 试剂操作日志
- `POST /feedback/add`

**Files:**
- Create: `BSB-Backend/src/modules/box/box-log.controller.ts`
- Create: `BSB-Backend/src/modules/feedback/` (module/controller/service/dto)

**Step 1: BoxLog 按时间倒序分页返回（limit/offset 参数）**

**Step 2: Feedback 只需 content 字段，自动关联当前用户**

**Step 3: 全量测试运行**

```bash
pnpm --filter BSB-Backend test
```

Expected: 所有单元测试 + E2E 测试通过。

**Step 4: Commit**

```bash
git commit -m "feat(backend): implement box operation logs and feedback endpoint"
```

---

## PHASE 3 — 前端完全重写

> **前置要求：** Phase 2 完成，有可用的后端 API。

### Task 13: 迁移前端技术栈

**目标：** 清理旧依赖（Vuetify、旧 ESLint），安装新技术栈。

**Files:**
- Modify: `BSB-Frontend/package.json`
- Delete: `BSB-Frontend/.eslintrc.cjs`
- Delete: `BSB-Frontend/.prettierrc.cjs`
- Modify: `BSB-Frontend/vite.config.ts`
- Modify: `BSB-Frontend/tailwind.config.js`
- Modify: `BSB-Frontend/postcss.config.js`
- Create: `BSB-Frontend/tsconfig.json`
- Create: `BSB-Frontend/env.d.ts`

**Step 1: 移除旧依赖**

```bash
cd BSB-Frontend
pnpm remove vuetify @mdi/font vue-router
```

**Step 2: 安装新依赖（含 TypeScript 6）**

```bash
pnpm add pinia @pinia/colada alova vue-router
pnpm add zod gsap
pnpm add -D typescript@~6 vue-tsc@latest tailwindcss@3 autoprefixer postcss
pnpm add -D @fontsource/inter
```

> 若 `typescript@~6` 与 `vue-tsc` 或 `shadcn-vue` 存在不可解决的兼容问题，回退执行：
> ```bash
> pnpm add -D typescript@~5.8 vue-tsc@latest
> ```
> 并在对应 commit message 中附上兼容问题描述。

**Step 2.1: 配置 tsconfig.json**

创建 `BSB-Frontend/tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

创建 `BSB-Frontend/env.d.ts`：
```ts
/// <reference types="vite/client" />
```

**Step 3: 初始化 shadcn-vue**

```bash
pnpm dlx shadcn-vue@latest init
```

选择选项：
- Style: Default
- Base color: Neutral
- CSS variables: Yes

**Step 4: 更新 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

**Step 5: 验证开发服务器启动**

```bash
pnpm dev
```

Expected: 无报错，空白页面。

**Step 6: Commit**

```bash
git commit -m "chore(frontend): migrate to shadcn-vue + alova + pinia + zod + gsap + TypeScript 6 stack"
```

---

### Task 14: 实现设计系统（Design Tokens + 基础组件）

**目标：** 将 DESIGN.md 映射为 Tailwind config + CSS 变量 + shadcn-vue 主题。

**Files:**
- Modify: `BSB-Frontend/tailwind.config.js`
- Modify: `BSB-Frontend/src/style.css`
- Create: `BSB-Frontend/src/utils/animation.ts`
- Install shadcn-vue components: Button, Card, Input, Dialog, Badge, Avatar, Separator, DropdownMenu, Tooltip

**Step 1: 扩展 tailwind.config.js**

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bsb: {
          bg: {
            marketing: '#08090a',
            panel: '#0f1011',
            surface: '#191a1b',
            secondary: '#28282c',
          },
          text: {
            primary: '#f7f8f8',
            secondary: '#d0d6e0',
            tertiary: '#8a8f98',
            quaternary: '#62666d',
          },
          accent: {
            brand: '#5e6ad2',
            violet: '#7170ff',
            hover: '#828fff',
          },
          border: {
            subtle: 'rgba(255,255,255,0.05)',
            standard: 'rgba(255,255,255,0.08)',
          },
          status: {
            green: '#27a644',
            emerald: '#10b981',
          },
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'SF Pro Display', '-apple-system', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['Berkeley Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        emphasis: '510',    // Linear 签名权重（通过 font-variation-settings）
        semibold: '590',
      },
    },
  },
}
```

**Step 2: 更新 style.css**

```css
@import '@fontsource/inter/variable.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-feature-settings: "cv01", "ss03";
}

html {
  background-color: #08090a;
  color: #f7f8f8;
}

/* shadcn-vue CSS 变量覆写（dark theme） */
.dark {
  --background: 0 0% 3.5%;        /* #08090a */
  --foreground: 210 17% 98%;      /* #f7f8f8 */
  --card: 0 0% 6.6%;              /* #0f1011 */
  --card-foreground: 210 17% 98%;
  --primary: 234 57% 59%;         /* #5e6ad2 */
  --primary-foreground: 0 0% 98%;
  --muted: 220 9% 15%;            /* #191a1b */
  --muted-foreground: 220 9% 60%;
  --border: rgba(255,255,255,0.08);
  --input: rgba(255,255,255,0.05);
  --ring: #5e6ad2;
}
```

**Step 3: 安装 shadcn-vue 基础组件**

```bash
pnpm dlx shadcn-vue@latest add button card input badge avatar separator dialog dropdown-menu tooltip
```

**Step 4: 创建 animation.ts**

```ts
// src/utils/animation.ts
import { gsap } from 'gsap'

export function fadeSlideIn(el: Element, delay = 0): gsap.core.Tween {
  return gsap.fromTo(el,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.2, delay, ease: 'power2.out' }
  )
}

export function staggerListIn(els: Element[] | NodeListOf<Element>): gsap.core.Tween {
  return gsap.fromTo(els,
    { opacity: 0, y: 6 },
    { opacity: 1, y: 0, duration: 0.15, stagger: 0.03, ease: 'power2.out' }
  )
}

export function pageTransitionIn(el: Element): gsap.core.Tween {
  return gsap.fromTo(el,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
  )
}
```

**Step 5: Commit**

```bash
git commit -m "feat(frontend): implement design system tokens and base components"
```

---

### Task 15: 实现 alova 客户端 + Pinia Stores

**Files:**
- Create: `BSB-Frontend/src/api/client.ts`
- Create: `BSB-Frontend/src/api/modules/auth.ts`
- Create: `BSB-Frontend/src/api/modules/user.ts`
- Create: `BSB-Frontend/src/api/modules/org.ts`
- Create: `BSB-Frontend/src/api/modules/box.ts`
- Create: `BSB-Frontend/src/api/modules/reagent.ts`
- Create: `BSB-Frontend/src/api/modules/file.ts`
- Create: `BSB-Frontend/src/schemas/` (各模块 zod schema，`.ts` 文件)
- Create: `BSB-Frontend/src/stores/auth.ts`
- Create: `BSB-Frontend/src/stores/org.ts`
- Create: `BSB-Frontend/src/stores/ui.ts`

**Step 1: 配置 alova 实例**

```ts
// src/api/client.ts
import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import vueHook from 'alova/vue'

interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
}

export const alovaInstance = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  statesHook: vueHook,
  requestAdapter: adapterFetch(),
  beforeRequest(method) {
    // JWT 从 httpOnly cookie 自动发送（withCredentials）
    method.config.credentials = 'include'
  },
  responded: {
    onSuccess: async (response: Response) => {
      const json: ApiResponse = await response.json()
      if (!json.success) throw new Error(json.message || 'API Error')
      return json.data
    },
    onError: (err: Error) => { throw err },
  },
})
```

**Step 2: 定义各模块 API 方法（以 auth 为例）**

```ts
// src/api/modules/auth.ts
import { alovaInstance } from '../client'
import type { UserInfo, LoginForm, RegisterForm } from '@/schemas/user.schema'

export const login = (data: LoginForm) =>
  alovaInstance.Post<UserInfo>('/auth/login', data)

export const register = (data: RegisterForm) =>
  alovaInstance.Post<UserInfo>('/auth/register', data)

export const logout = () =>
  alovaInstance.Post<void>('/auth/logout')

export const getMyInfo = () =>
  alovaInstance.Get<UserInfo>('/user/info')
```

**Step 3: 定义 zod schemas**

```ts
// src/schemas/user.schema.ts
import { z } from 'zod'

export const UserInfoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  nickname: z.string().nullable(),
  realname: z.string().nullable(),
})

export type UserInfo = z.infer<typeof UserInfoSchema>

export const LoginFormSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
})

export type LoginForm = z.infer<typeof LoginFormSchema>

export const RegisterFormSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
})

export type RegisterForm = z.infer<typeof RegisterFormSchema>
```

**Step 4: 实现 Pinia auth store**

```ts
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { getMyInfo, logout } from '@/api/modules/auth'
import type { UserInfo } from '@/schemas/user.schema'

interface AuthState {
  user: UserInfo | null
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ user: null, initialized: false }),
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
  actions: {
    async fetchMe() {
      try {
        this.user = await getMyInfo()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
    async logout() {
      await logout()
      this.user = null
    },
  },
})
```

**Step 5: Commit**

```bash
git commit -m "feat(frontend): implement alova API client and pinia stores"
```

---

### Task 16: 实现认证页面和路由

**Files:**
- Create: `BSB-Frontend/src/layouts/AuthLayout.vue`
- Create: `BSB-Frontend/src/layouts/AppLayout.vue`
- Create: `BSB-Frontend/src/pages/auth/LoginPage.vue`
- Create: `BSB-Frontend/src/pages/auth/RegisterPage.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/App.vue`

**Step 1: 配置 Vue Router + JWT 守卫**

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', component: () => import('@/pages/auth/LoginPage.vue'), meta: { public: true } },
  { path: '/register', component: () => import('@/pages/auth/RegisterPage.vue'), meta: { public: true } },
  { path: '/', component: () => import('@/layouts/AppLayout.vue'), children: [
    { path: '', redirect: '/dashboard' },
    { path: 'dashboard', component: () => import('@/pages/dashboard/DashboardPage.vue') },
    { path: 'box', component: () => import('@/pages/box/BoxListPage.vue') },
    { path: 'box/:id', component: () => import('@/pages/box/BoxDetailPage.vue') },
    { path: 'org', component: () => import('@/pages/org/OrgManagePage.vue') },
    { path: 'user', component: () => import('@/pages/user/ProfilePage.vue') },
    { path: 'reagent', component: () => import('@/pages/reagent/ReagentPage.vue') },
  ]},
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.fetchMe()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
})

export default router
```

**Step 2: 实现 LoginPage（符合 DESIGN.md）**

- 背景：`#08090a`
- 居中卡片：`background: rgba(255,255,255,0.02)`，`border: 1px solid rgba(255,255,255,0.08)`，`border-radius: 12px`
- 表单使用 shadcn-vue Input + Button
- zod 校验：`LoginFormSchema.safeParse(formData)` before submit
- 登录成功后 `router.push('/dashboard')`

**Step 3: 实现 AppLayout（主应用布局）**

- 左侧固定侧边栏（240px），背景 `#0f1011`
- 顶栏（48px），背景 `#0f1011`，底部 `border-bottom: 1px solid rgba(255,255,255,0.05)`
- 主内容区背景 `#08090a`
- 路由切换时 `pageTransitionIn` 动效

**Step 4: Commit**

```bash
git commit -m "feat(frontend): implement auth flow, routing, and app layout"
```

---

### Task 17: 实现业务页面

**Files:**
- Create: `BSB-Frontend/src/pages/dashboard/DashboardPage.vue`
- Create: `BSB-Frontend/src/pages/box/BoxListPage.vue`
- Create: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`
- Create: `BSB-Frontend/src/pages/org/OrgManagePage.vue`
- Create: `BSB-Frontend/src/pages/org/OrgMembersPage.vue`
- Create: `BSB-Frontend/src/pages/user/ProfilePage.vue`
- Create: `BSB-Frontend/src/pages/reagent/ReagentPage.vue`
- Create: `BSB-Frontend/src/components/app/BoxGrid.vue`
- Create: `BSB-Frontend/src/components/app/OrgSelector.vue`

**每个页面的实现模式：**

> 所有 `.vue` 文件使用 `<script setup lang="ts">`，所有独立脚本使用 `.ts` 后缀。

```vue
<!-- 以 BoxListPage.vue 为例 -->
<script setup lang="ts">
import { useRequest } from 'alova/client'
import { staggerListIn } from '@/utils/animation'
import { getBoxList } from '@/api/modules/box'
import { useOrgStore } from '@/stores/org'
import { ref, watch, nextTick } from 'vue'

const org = useOrgStore()
const { data: boxes, loading } = useRequest(() => getBoxList({ orgId: org.currentOrgId }))

const listRef = ref<HTMLElement | null>(null)
watch(boxes, () => {
  nextTick(() => {
    const items = listRef.value?.querySelectorAll('[data-item]')
    if (items) staggerListIn(items)
  })
})
</script>

<template>
  <!-- 遵循 DESIGN.md 颜色 + 间距系统 -->
</template>
```

**BoxGrid 组件（核心可视化组件）：**

- 渲染 rows × cols 的网格
- 每个格子显示试剂名称（如有）
- 支持点击选中格子（hover 高亮）
- 使用 gsap 在格子加载时 stagger-in

**Step 1: 按页面逐一实现，每个页面遵守 DESIGN.md 颜色规范**

**Step 2: 验证所有页面路由可访问**

**Step 3: Commit**

```bash
git commit -m "feat(frontend): implement box/org/reagent management pages"
```

---

### Task 18: 最终验证与收尾

**Step 1: 全量格式检查**

```bash
pnpm run format:check
```

Expected: 通过。

**Step 2: 后端 lint + build + test**

```bash
pnpm --filter BSB-Backend lint
pnpm --filter BSB-Backend build
pnpm --filter BSB-Backend test
```

Expected: 全部通过。

**Step 3: 前端 type-check + lint + build**

```bash
pnpm --filter BSB-Frontend type-check  # vue-tsc --noEmit
pnpm --filter BSB-Frontend lint
pnpm --filter BSB-Frontend build
```

Expected: 类型检查通过，无错误，`dist/` 生成。

**Step 4: Docker 验证**

```bash
docker compose up --build -d
docker compose ps
```

Expected: 所有容器 running，健康检查通过。

**Step 5: 最终 Commit**

```bash
git commit -m "chore: final verification and cleanup for BSB mega refactor"
```

---

## 快速参考

### 测试运行命令

```bash
# 单个模块单元测试
pnpm --filter BSB-Backend test -- --testPathPattern="org.service.spec"
# 全量测试
pnpm --filter BSB-Backend test
# 仅 E2E
pnpm --filter BSB-Backend test -- --testPathPattern="e2e"
```

### 常用开发命令

```bash
pnpm --filter BSB-Backend start:dev      # 热重载开发
pnpm --filter BSB-Backend db:migrate     # 数据库迁移
pnpm --filter BSB-Backend db:gen-client  # 重新生成 Prisma Client
pnpm --filter BSB-Frontend dev           # 前端开发服务器
```

### 错误码新增模式（AGENTS.md 规范）

```typescript
// src/modules/<module>/error-catalog.constant.ts
export const MODULE_ERRORS = {
  NOT_FOUND: {
    code: 'MOD_0001',
    message: '资源不存在',
    httpStatus: 404,
  },
} as const satisfies ErrorCatalog
```
