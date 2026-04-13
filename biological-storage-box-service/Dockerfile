# ===== 构建阶段 =====
FROM node:22.22-slim AS builder

RUN apt-get update -y \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

WORKDIR /repo

# 1. 先只复制 workspace 元文件和所有包的 package.json
#    目的：最大化 Docker 层缓存——只有 package.json 变化时才重新 install
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY biological-storage-box-service/package.json ./biological-storage-box-service/
COPY biological-storage-box-web/package.json ./biological-storage-box-web/
COPY biological-storage-box-docs/package.json ./biological-storage-box-docs/

# 2. 安装全部工作区依赖（lockfile 锁版本）
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3. 复制 service 源码（在 install 之后，避免源码变化导致 install 层缓存失效）
COPY biological-storage-box-service/src ./biological-storage-box-service/src
COPY biological-storage-box-service/tsconfig.json \
     biological-storage-box-service/tsconfig.build.json \
     biological-storage-box-service/nest-cli.json \
     biological-storage-box-service/prisma.config.ts \
     ./biological-storage-box-service/
COPY biological-storage-box-service/prisma ./biological-storage-box-service/prisma
COPY biological-storage-box-service/config ./biological-storage-box-service/config

# 4. 生成 Prisma Client + 编译 TypeScript
ARG DATABASE_URL="postgresql://username:password@host:5432/dbName?schema=public"
ARG SHADOW_DATABASE_URL="postgresql://username:password@host:5432/dbName?schema=public"

RUN cd biological-storage-box-service \
    && pnpm prisma generate \
    && pnpm build

# 5. pnpm deploy：将 service 的纯生产依赖提取到独立目录（无 devDeps，无 symlink）
RUN pnpm --filter biological-storage-box-service deploy --prod /app/deploy

# ===== 运行阶段 =====
FROM node:22.22-slim AS runner

WORKDIR /app

# 从构建阶段复制 deploy 产物
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /repo/biological-storage-box-service/dist ./dist

# .env.* 文件在构建时从 service 目录复制（含加密的 dotenvx 文件）
COPY biological-storage-box-service/.env.* ./

RUN apt-get update -y \
    && apt-get install -y openssl curl \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && rm -rf /var/lib/apt/lists/* \
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
    CMD curl --fail http://localhost:3000/health

CMD ["sh", "-c", "exec dotenvx run -f .env.${NODE_ENV} -- node dist/src/main.js"]
