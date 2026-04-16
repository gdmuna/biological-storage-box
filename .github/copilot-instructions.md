## 项目定位

生物样本储存管理系统 monorepo，包含三个工作区：
- `BSB-Backend` — NestJS 后端服务
- `BSB-Docsite` — VitePress 文档站
- `BSB-Frontend` — Vue 3 前端

## 文档导航

> 以下文档按需加载。仅在对应场景触发时才去读取，减少不必要的上下文占用。

| 文档 | 路径 | 何时加载 |
|------|------|--------|
| **后端 AI 操作手册** | [BSB-Backend/AGENTS.md](../BSB-Backend/AGENTS.md) | 涉及后端 service 代码时：模块职责、请求流程、架构决策、提交前自我审查 |
| 后端文档规范 | [BSB-Backend/docs/AGENTS.md](../BSB-Backend/docs/AGENTS.md) | 需要创建或修改后端文档时 |
| 后端架构设计 | [BSB-Backend/docs/03-architecture/](../BSB-Backend/docs/03-architecture/) | 涉及模块职责、请求流程、技术选型时 |
| **前端 AI 操作手册** | [BSB-Frontend/AGENTS.md](../BSB-Frontend/AGENTS.md) | 涉及前端任何代码时：组件、store、路由、API 调用、UI/UX、Bug 修复、E2E 测试 |

## 硬性约束

> 以下是工具链与安全层面的操作底线。

- 包管理：只用 `pnpm`，禁止 npm/yarn
- 后端架构分层：Controller → Service → Repository（Prisma）
- 前端架构分层：Page → Store（Pinia）→ API（Alova）；状态不绕过 store 直接写
- 依赖注入：优先使用构造函数注入与控制反转，除非迫不得已才手动 `new`
- 提交规范：`<type>(<scope>): <subject>`（Conventional Commits）
- 禁止绕过 Git 钩子（`--no-verify`）
- 禁止硬编码敏感信息，不假设 `.env` 文件存在
- 前端 shadcn-vue 组件（`src/components/ui/`）禁止直接手改，通过 shadcn skill 管理

## 常用命令速查

```bash
# monorepo 根
pnpm run format          # Prettier 格式化（全工作区）
pnpm run format:check    # 格式检查

# 后端 service
pnpm --filter BSB-Backend start:dev      # 热重载开发
pnpm --filter BSB-Backend build          # 编译 + 类型检查
pnpm --filter BSB-Backend test           # 单元测试 + E2E
pnpm --filter BSB-Backend lint:fix       # ESLint 自动修复
pnpm --filter BSB-Backend db:migrate     # 数据库迁移
pnpm --filter BSB-Backend db:gen-client  # 重新生成 Prisma Client

# 前端
pnpm --filter BSB-Frontend dev           # 启动开发服务器（:8081）
pnpm --filter BSB-Frontend type-check    # vue-tsc 类型检查
pnpm --filter BSB-Frontend test          # Vitest 单元测试
pnpm --filter BSB-Frontend test:e2e      # Playwright E2E 测试
pnpm --filter BSB-Frontend build         # 构建产物
pnpm --filter BSB-Frontend eslint        # ESLint 自动修复
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **biological-storage-box** (1642 symbols, 2446 relationships, 52 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/biological-storage-box/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/biological-storage-box/context` | Codebase overview, check index freshness |
| `gitnexus://repo/biological-storage-box/clusters` | All functional areas |
| `gitnexus://repo/biological-storage-box/processes` | All execution flows |
| `gitnexus://repo/biological-storage-box/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
