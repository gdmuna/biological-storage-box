# ===== 构建阶段 =====
FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

# 先复制 workspace 级别的依赖描述文件，充分利用 layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
# apps/backend 和 apps/docsite 的 package.json 仅用于让 pnpm workspace 解析
# COPY apps/backend/package.json ./apps/backend/
# COPY apps/docsite/package.json ./apps/docsite/

RUN pnpm --filter @talos-ark/frontend install --frozen-lockfile --ignore-scripts

# 复制前端源码
COPY apps/frontend/ ./apps/frontend/

# 构建产物输出到 apps/frontend/dist

RUN pnpm --filter @talos-ark/frontend build

# ===== 运行阶段 =====
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Vite 构建产物
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
