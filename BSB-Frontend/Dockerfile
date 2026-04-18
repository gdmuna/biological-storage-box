# ===== 前端镜像 =====

# ---- 阶段1：构建 ----
FROM node:22-slim AS builder

RUN npm install -g pnpm

WORKDIR /app

# 先复制 workspace 级别的依赖描述文件，充分利用 layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY BSB-Frontend/package.json ./BSB-Frontend/
# BSB-Backend 和 BSB-Docsite 的 package.json 仅用于让 pnpm workspace 解析
COPY BSB-Backend/package.json ./BSB-Backend/
COPY BSB-Docsite/package.json ./BSB-Docsite/

RUN pnpm install --frozen-lockfile --ignore-scripts

# 复制前端源码
COPY BSB-Frontend/ ./BSB-Frontend/

# 构建产物输出到 BSB-Frontend/dist
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm --filter BSB-Frontend build

# ---- 阶段2：运行（非 root nginx）----
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Vite 构建产物
COPY --from=builder /app/BSB-Frontend/dist /usr/share/nginx/html

# nginx 配置
COPY BSB-Frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
