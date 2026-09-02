# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TalosArk (璇玑云库) — biological sample storage management system. pnpm monorepo with three workspaces:

| Workspace | Stack | Purpose |
|-----------|-------|---------|
| `apps/backend` | NestJS (Fastify) · Prisma · PostgreSQL · Zod | REST API, auth, business logic |
| `apps/frontend` | Vue 3 · Pinia · Alova · shadcn-vue · Tailwind v4 · Tauri | Desktop client |
| `apps/docsite` | VitePress | Project documentation site |

Node ≥ 22, pnpm ≥ 11, PostgreSQL ≥ 18. License: AGPL-3.0.

## Essential Commands

```bash
# ── Development ──
pnpm --filter @talos-ark/backend start:dev    # Backend on :3000 (hot reload)
pnpm --filter @talos-ark/frontend vite         # Frontend on :8081

# ── Testing ──
pnpm --filter @talos-ark/backend test          # Vitest (unit + E2E)
pnpm --filter @talos-ark/backend test:watch    # Watch mode
pnpm --filter @talos-ark/frontend test         # Vitest unit tests (jsdom)
pnpm --filter @talos-ark/frontend test:e2e     # Playwright E2E

# ── Type checking & build ──
pnpm --filter @talos-ark/backend build         # nest build + tsc-alias
pnpm --filter @talos-ark/frontend type-check   # vue-tsc --noEmit
pnpm --filter @talos-ark/frontend build        # vite build (includes type-check)

# ── Database ──
pnpm --filter @talos-ark/backend db:gen-client # Regenerate Prisma client
pnpm --filter @talos-ark/backend db:migrate    # Run migrations
pnpm --filter @talos-ark/backend db:push       # Push schema without migrations
pnpm --filter @talos-ark/backend db:studio     # Prisma Studio GUI

# ── Lint & format ──
pnpm format                                    # Prettier (all workspaces)
pnpm lint                                      # ESLint (all workspaces)
pnpm --filter @talos-ark/backend lint:fix      # Backend auto-fix

# ── Docker ──
docker compose -f apps/backend/docker-compose.yml up -d  # PostgreSQL + backend
```

## Domain Model

Hierarchical storage structure: **ROOT → CONTAINER → BOX → BOX_SLOT** (Node model, self-referential tree via `parentId`). Each node belongs to an `Organization`.

```
Organization (multi-tenant isolation)
  ├── Node (tree hierarchy: ROOT/container → BOX → BOX_SLOT)
  │   ├── NodeGridConfig (box row×col grid)
  │   ├── NodeImage
  │   └── NodeLog
  ├── Reagent (placed at a slot position within a node)
  │   ├── ReagentType (category: color, unit, description)
  │   └── ReagentLog (PLACED/TAKEN/MOVED/UPDATED/DELETED)
  ├── ResourceShare (cross-org node sharing: READ/WRITE)
  ├── OrganizationUser (membership: OWNER/ADMIN/MEMBER)
  └── User → UserProfile, EmailVerification, Feedback, File
```

Prisma schema: [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)

## Backend Architecture

**Layers (strict):** Controller → Service → Repository (Prisma). Enforced via NestJS DI container — no manual `new` for injected dependencies.

```
src/
├── modules/        # Business domains: auth, user, org, node, reagent, reagent-type, share, file, feedback
│   └── <module>/
│       ├── <module>.controller.ts   # Route handlers, input validation via Zod DTOs
│       ├── <module>.service.ts      # Business logic
│       ├── <module>.dto.ts          # Zod schemas for request/response
│       ├── <module>.module.ts       # NestJS module definition
│       └── services/                # Supporting services (e.g., auth/jwt)
├── infra/          # Infrastructure: database, kvs (cache), mail, storage (S3), als, logger
├── common/         # Cross-cutting: decorators, exceptions, services (Logger), utils (helpers/formatters/validators/errors)
├── constants/      # Configuration & error catalog — loaded via @nestjs/config
├── types/          # Global type extensions
├── app.module.ts   # Root module: imports all modules, registers global pipes/interceptors/filters
└── main.ts         # Bootstrap: Fastify adapter, helmet, cookies, multipart, Swagger + Scalar UI
```

**AOP chain (global):** Middleware → Guard (Throttler) → Pipe (Zod validation) → Controller → Interceptors (Performance, ResponseFormat, Timeout, ZodSerializer) → Filters (ZodException, ThrottlerException, AllException → fallback)

**Key patterns:**
- **Environment config**: Encrypted via dotenvx. `.env.keys` holds decryption key. Env files in `secrets/env/`. Commands prefix with `dotenvx run -f secrets/env/.env.<NODE_ENV> --` when env is needed.
- **API versioning**: URI-based (`/api/v1/...`), default v1.
- **Response envelope**: All responses wrapped as `{ success, data, timestamp, context: { requestId, time, version } }`. Errors have `code`, `message`, `type` (URI).
- **Pino logger**: Structured JSON logging. `req.id` is a ULID per request. Slow request threshold: ≥1000ms warn, ≥3000ms error.
- **Testing**: Vitest with globals enabled. Unit tests mock Repository; E2E tests use real database via `supertest`. Test files: `test/unit/*.spec.ts` and `test/e2e/*.e2e-spec.ts`.

## Frontend Architecture

**Data flow (strict):** Page → Store (Pinia) → API (Alova). Components must NOT call API directly or bypass the store.

```
src/
├── pages/          # Route-mounted page components: auth, box, dashboard, node, org, reagent, reagent-type, room, user
├── stores/         # Pinia stores (setup-syntax): auth, org, node, reagent, ui
├── api/            # Alova client + per-module request functions
├── router/         # Vue Router config + guards (auth check, org context)
├── schemas/        # Zod schemas — shared type contract with backend
├── components/     # Business components + ui/ (shadcn-vue — DO NOT edit directly)
├── layouts/        # App shell, sidebar, topbar
├── lib/            # Utility libraries
└── utils/          # Helpers, animation wrappers
```

**Key patterns:**
- Tailwind v4 with `bsb-*` CSS custom properties for design tokens.
- shadcn-vue components in `src/components/ui/` — must use shadcn skill to add/modify, never edit directly.
- Alova interceptors handle 401 → token refresh transparently. Components just `try/catch`.
- Zod schemas in `src/schemas/` are the type contract — response types inferred via `z.infer`, not hand-written interfaces.
- Playwright E2E config: `test/e2e/global.setup.ts`.

## Critical Constraints

- **Package manager**: pnpm only. `engine-strict=true` in `.npmrc`.
- **Commit format**: Conventional Commits (`<type>(<scope>): <subject>`).
- **No `--no-verify`**: Never skip Git hooks.
- **No hardcoded secrets**: All config via env vars, encrypted with dotenvx.
- **No manual DI**: Use NestJS constructor injection. `modules/` never references `infra/` concrete classes directly.
- **Frontend state**: Always through Pinia store actions — never mutate store state in components.
- **Before editing any symbol**: Run GitNexus impact analysis. See [AGENTS.md](AGENTS.md) for GitNexus workflow.

## Supplementary Documentation

For detailed workflows, design principles, and per-workspace conventions, see:
- [AGENTS.md](AGENTS.md) — Root-level AI manual (architecture principles, GitNexus tools, task checklists)
- [apps/backend/AGENTS.md](apps/backend/AGENTS.md) — Backend-specific AI manual (SOLID principles, context paths, verification sequences)
- [apps/frontend/AGENTS.md](apps/frontend/AGENTS.md) — Frontend-specific AI manual (bug diagnosis, component hierarchy, E2E patterns)
- [ROADMAP.md](ROADMAP.md) — Feature roadmap (P0–P3 priorities)
- [PROGRESS.md](PROGRESS.md) — Per-module progress tracking and DoD checklists
