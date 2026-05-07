# Jest → Vitest 迁移计划

> **状态：已执行完毕（2026-05-07）**
> 本文件已在执行后回顾更新，标注了计划与实际的差异。

**Goal:** 将整个测试套件从 Jest + ts-jest 迁移至 Vitest，消除 ESM 兼容 workaround，同时保持所有测试用例完整通过。

**Architecture:** Vitest 原生支持 ESM，与 Jest API 高度兼容（`describe/it/expect` 不变，`jest.*` → `vi.*`），通过 Vite 原生 `resolve.tsconfigPaths` 复用现有 `tsconfig.json` 的路径别名，无需额外的 shim 或 `moduleNameMapper` 配置。

**Tech Stack（实际）：** Vitest 4.x · @vitest/coverage-v8 · vite@^6 · @nestjs/testing（不变）· supertest（不变）

> **计划偏差：** 原计划使用 Vitest 3.x + `vite-tsconfig-paths` 插件。实际升级到 Vitest 4.x，并改用 Vite 6 原生路径解析（见附录 §A）。

---

## 背景与注意事项

### 为什么迁移

- `uuid` v14 纯 ESM，当前方案依赖 `test/__mocks__/uuid.ts` shim + `moduleNameMapper` 绕过 Jest CJS 限制
- Jest 的 ESM 支持需要 `--experimental-vm-modules`，配置复杂
- Vitest 原生 ESM，上述问题消失

### 变更清单总览

| 动作 | 文件 |
|------|------|
| 删除 | `jest.config.js`、`test/__mocks__/uuid.ts` |
| 新建 | `vitest.config.ts`、`tsconfig.test.json` |
| 修改 | `package.json`（scripts + devDependencies） |
| 修改 | `tsconfig.json`（移除 `jest` 类型声明） |
| 修改 | `eslint.config.js`（`globals.jest` → `globals.vitest`） |
| 修改 | 5 个异常文件（修复循环 ESM 导入，见附录 §B） |
| 修改 | 7 个单元测试文件（`jest.*` → `vi.*`，类型注解） |

### API 对照表

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.Mocked<T>` (type) | `Mocked<T>`（需 `import type { Mocked } from 'vitest'`） |
| `jest.spyOn()` | `vi.spyOn()` |

`describe / it / expect / beforeEach / beforeAll / afterAll` 保持不变（Vitest globals 模式）。

---

## Task 1: 创建 Feature 分支

**Files:**
- 无文件变更，仅 Git 操作

**Step 1: 从 dev 切出 feature 分支**

```bash
git checkout dev
git checkout -b feature/jest-to-vitest
```

预期输出：`Switched to a new branch 'feature/jest-to-vitest'`

---

## Task 2: 替换依赖包

**Files:**
- Modify: `package.json`（由 pnpm 自动写入）
- Modify: `pnpm-lock.yaml`（自动）

**Step 1: 移除 Jest 相关包**

```bash
pnpm remove jest @types/jest ts-jest
```

**Step 2: 安装 Vitest 相关包**

```bash
pnpm add -D vitest @vitest/coverage-v8 vite@^6
```

> **⚠ pnpm workspace peer dep 陷阱：** Vitest 4 要求 `vite ^6`，但 `website/` 子包通过 vitepress 引入了 vite 5。若根包不显式声明 `vite@^6`，pnpm 会将 vite 5 "借给"根包，导致 peer dep 冲突报错。在根包 devDependencies 中显式声明 `vite@^6` 可使两者共存（各自隔离）。

**Step 3: 验证**

```bash
node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); const d=p.devDependencies; console.log('vitest:', d.vitest); if(d.jest||d['ts-jest']||d['@types/jest']) throw new Error('jest packages still present');"
```

---

## Task 3: 创建 vitest.config.ts

**Files:**
- Create: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        tsconfigPaths: true, // Vite 6 原生支持，无需 vite-tsconfig-paths 插件
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
        testTimeout: 30_000,
        typecheck: {
            tsconfig: './tsconfig.test.json',
        },
        coverage: {
            provider: 'v8',
            reporter: process.env['CI'] === 'true' ? ['lcov', 'text'] : ['text'],
            include: ['src/**/*.{ts,js}'],
            exclude: ['src/**/*.spec.ts', 'src/**/*.e2e-spec.ts', 'src/main.ts'],
        },
    },
});
```

> **计划偏差：** 原计划使用 `vite-tsconfig-paths` 插件。Vite 6 已内置 `resolve.tsconfigPaths` 选项，插件会输出废弃警告，直接使用原生选项即可，无需安装插件。
>
> **关于 `emitDecoratorMetadata`：** 原计划（针对 Vitest 3）需要 `unplugin-swc` 来支持此选项（Vitest 3 默认 esbuild 不支持）。Vitest 4 改用 OXC transformer，原生支持 `emitDecoratorMetadata`，无需 SWC，配置因此更简洁。

---

## Task 4: 创建 tsconfig.test.json

**Files:**
- Create: `tsconfig.test.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals"]
  },
  "include": ["src", "test"]
}
```

---

## Task 5: 更新配置文件

**Files:**
- Modify: `package.json` — scripts
- Modify: `tsconfig.json` — 移除 `jest` 类型
- Modify: `eslint.config.js` — 替换全局变量

**Step 1: 修改 package.json 测试脚本**

```json
"test": "dotenvx run -f .env.test -- vitest run",
"test:watch": "dotenvx run -f .env.test -- vitest",
```

**Step 2: 修改 tsconfig.json**

移除对 `@types/jest` 的引用（该包已卸载，留着会导致构建报 `TS2688`）：

```json
// 改前
"types": ["jest", "node"]
// 改后
"types": ["node"]
```

测试环境的类型由 `tsconfig.test.json` 的 `"types": ["vitest/globals"]` 单独提供，不污染生产构建。

**Step 3: 修改 eslint.config.js**

`globals` 包已内置 `vitest` 条目，直接替换即可：

```javascript
// 改前
...globals.jest,
// 改后
...globals.vitest,
```

---

## Task 6: 修复异常文件的循环 ESM 导入

> **⚠ 此任务在原计划中缺失，但执行时必须处理。**

**背景：** `src/common/exceptions/index.ts` 通过 side-effect import 加载 5 个异常文件（`database.exception.ts` 等），而这些文件又反向 import 回 `index.ts`。Jest（CJS 模式）对循环引用有兼容处理，Vitest（严格 ESM）会导致 `extends undefined` 崩溃。

**受影响的 5 个文件：**

| 文件 | 原导入 | 改为 |
|------|--------|------|
| `src/infra/database/database.exception.ts` | `from '@/common/exceptions/index.js'` | `from '@/common/exceptions/app.exception.js'` + `exception-registry.js` |
| `src/infra/storage/storage.exception.ts` | 同上 | 同上 |
| `src/modules/auth/auth.exception.ts` | 同上 | `from '@/common/exceptions/client.exception.js'` + `exception-registry.js` |
| `src/modules/exception-catalog/exception-catalog.exception.ts` | 同上 | 同上 |
| `src/modules/file/file.exception.ts` | 同上 | `from '@/common/exceptions/app.exception.js'` + `exception-registry.js` |

**规则：** 被 `index.ts` 作为 side-effect 加载的异常文件，必须直接导入具体源文件，不能通过 barrel `index.ts`。

---

## Task 7: 批量替换 jest.* → vi.*

**受影响的文件（7 个单元测试，E2E 不含 jest 引用）：**

```powershell
Get-ChildItem -Path test -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content -replace 'jest\.fn\(\)', 'vi.fn()' `
                        -replace 'jest\.clearAllMocks\(\)', 'vi.clearAllMocks()'
    if ($content -ne $updated) {
        Set-Content $_.FullName $updated -NoNewline
        Write-Host "Updated: $($_.Name)"
    }
}
```

---

## Task 8: 修复 Mocked\<T\> 类型注解

受影响文件（共 3 个）：`file.service.spec.ts`、`file.controller.spec.ts`、`auth.service.spec.ts`

在各文件顶部添加：

```typescript
import type { Mocked } from 'vitest';
```

将 `jest.Mocked<` 替换为 `Mocked<`。

> **⚠ 重载函数的额外处理：** `TokenService.verifyToken` 是重载函数，`Mocked<Pick<TokenService, 'verifyToken'>>` 会产生类型冲突（`Mock<overloads>` 无法满足 `MockInstance<overloads> & callable` 联合约束）。使用断言绕过：
>
> ```typescript
> // ❌ 会报类型错误
> const mockTokenService: Mocked<Pick<TokenService, 'issueTokenPair' | 'verifyToken'>> = { ... };
>
> // ✅ 正确写法
> const mockTokenService = {
>     issueTokenPair: vi.fn(),
>     verifyToken: vi.fn(),
> } as unknown as Mocked<Pick<TokenService, 'issueTokenPair' | 'verifyToken'>>;
> ```

---

## Task 9: 删除冗余文件

```bash
Remove-Item jest.config.js
Remove-Item test/__mocks__/uuid.ts
Remove-Item test/__mocks__  # 目录已空时
```

---

## Task 10: 运行完整验证序列

```bash
pnpm format   # 格式化
pnpm lint     # 0 errors
pnpm build    # 编译通过
pnpm test     # 9 files, 58 tests passed
```

---

## Task 11: 提交并合并

```bash
git add -A
git commit -m "chore(test): migrate test runner from Jest to Vitest"
git checkout dev
git merge --ff-only feature/jest-to-vitest
git branch -d feature/jest-to-vitest
git push
```

---

## 附录 A：Vitest 版本选择

原计划选用 Vitest 3.x，实际升级到 Vitest 4.x。差异如下：

| 方面 | Vitest 3.x（原计划） | Vitest 4.x（实际） |
|------|--------------------|--------------------|
| 默认 transformer | esbuild（不支持 `emitDecoratorMetadata`） | OXC（原生支持） |
| tsconfig 路径 | 需 `vite-tsconfig-paths` 插件 | `resolve.tsconfigPaths: true` 原生支持 |
| peer dep | vite 不限版本 | 需要 vite ^6（需在根包显式声明） |
| NestJS DI 支持 | 需 `unplugin-swc` 过渡 | 开箱即用 |

Vitest 4 的配置更简洁，无需任何插件。

---

## 附录 B：循环 ESM 导入的根因

`src/common/exceptions/index.ts` 的结构：

```typescript
export * from './app.exception.js';         // 定义 InfraException 等基类
// ...
import '@/infra/database/database.exception.js';  // side-effect：注册异常类
```

而 `database.exception.ts` 反向引用：

```typescript
import { InfraException } from '@/common/exceptions/index.js';  // ← 循环！
```

在 CJS 下（Jest），模块系统对循环引用有缓存兼容，`InfraException` 在评估时已存在。在 ESM 下（Vitest），模块图严格求值，`index.ts` 尚未完成导出时就被子文件引用，导致 `InfraException` 为 `undefined`，`extends undefined` 崩溃。

**修复原则：** 被 `index.ts` side-effect 导入的叶节点文件，必须直接导入具体模块，不得通过 barrel 文件反向引用。

---

## 快速参考：遇到问题时

| 症状 | 原因 | 解决 |
|------|------|------|
| `Cannot find module 'vitest/config'` | vitest 未安装 | `pnpm add -D vitest` |
| `vi is not defined` | `globals: true` 未生效 | 检查 `vitest.config.ts` 的 `test.globals` |
| 类型错误 `Cannot find name 'vi'` | `tsconfig.test.json` 未配置 | 确认 `"types": ["vitest/globals"]` |
| 路径别名解析失败 `@/...` | `resolve.tsconfigPaths` 未设置 | 确认 `resolve: { tsconfigPaths: true }` |
| `TS2688: Cannot find type definition file for 'jest'` | `tsconfig.json` 仍有 `"types": ["jest"]` | 移除 `jest`，保留 `node` |
| `Class extends value undefined` | 循环 ESM 导入 | 见附录 §B，改为直接导入具体源文件 |
| `Mocked<T>` 重载类型冲突 | Vitest `Mock<overloads>` 不兼容重载签名 | 使用 `as unknown as Mocked<T>` 断言 |
| E2E 超时 | 默认超时 5s 不够 | `vitest.config.ts` 中已设 `testTimeout: 30_000` |
| pnpm peer dep 冲突（vite 版本） | workspace 子包 vite 版本被借用 | 根包 devDeps 显式声明 `vite@^6` |
