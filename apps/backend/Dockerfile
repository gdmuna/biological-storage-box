# ===== 构建阶段 =====
FROM node:22.22-slim AS builder

WORKDIR /app

# 替换为国内镜像源（阿里云），避免官方源在国内网络不稳定
COPY apps/backend/config/apt/debian.sources /etc/apt/sources.list.d/debian.sources

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && npm install -g pnpm

# 1. 先只复制 workspace 元文件和所有包的 package.json
#    目的：最大化 Docker 层缓存——只有 package.json 变化时才重新 install
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY apps/backend/package.json ./apps/backend/
# COPY apps/frontend/package.json ./apps/frontend/
# COPY apps/docsite/package.json ./apps/docsite/

# 2. 安装工作区依赖（lockfile 锁版本）
RUN pnpm --filter @talos-ark/backend install --frozen-lockfile --ignore-scripts

# 3. 复制 service 源码（在 install 之后，避免源码变化导致 install 层缓存失效）
# COPY apps/backend/src ./apps/backend/src
# COPY apps/backend/tsconfig.json \
#      apps/backend/tsconfig.build.json \
#      apps/backend/nest-cli.json \
#      apps/backend/prisma.config.ts \
#      ./apps/backend/
# COPY apps/backend/prisma ./apps/backend/prisma
# COPY apps/backend/config ./apps/backend/config
COPY apps/backend/ ./apps/backend/

# 4. 生成 Prisma Client + 编译 TypeScript
ARG DATABASE_URL="postgresql://username:password@host:5432/dbName?schema=public"
ARG SHADOW_DATABASE_URL="postgresql://username:password@host:5432/dbName?schema=public"

RUN pnpm --filter @talos-ark/backend exec prisma generate \
    && pnpm --filter @talos-ark/backend build \
    && pnpm --filter @talos-ark/backend deploy --prod --legacy /app/deploy

# ===== 运行阶段 =====
FROM node:22.22-slim AS runner

WORKDIR /app

# 从构建阶段复制 deploy 产物
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist

# .env.* 文件在构建时从 service 目录复制（含加密的 dotenvx 文件）
COPY apps/backend/.env.* ./

# 替换为国内镜像源（阶云），避免官方源在国内网络不稳定
COPY apps/backend/config/apt/debian.sources /etc/apt/sources.list.d/debian.sources

RUN apt-get update \
    && apt-get install -y openssl curl \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && chown -R node:node /app

USER node

ARG APP_VERSION
ARG APP_NAME
ARG GIT_COMMIT

ENV APP_VERSION=$APP_VERSION \
    APP_NAME=$APP_NAME \
    GIT_COMMIT=$GIT_COMMIT \
    NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD curl --fail http://localhost:3000/api/v1/health

CMD ["sh", "-c", "exec dotenvx run -f .env.${NODE_ENV} -- node dist/src/main.js"]
