---
title: 认证模块
inherits: docs/03-architecture/STANDARD.md
status: active
version: "0.7.1"
last-updated: 2026-04-06
category: architecture
related:
  - docs/03-architecture/STANDARD.md
  - docs/03-architecture/project-architecture-overview.md
  - docs/03-architecture/request-pipeline.md
---

# 认证模块

`src/modules/auth/` 实现双令牌 JWT 认证，提供注册、登录、令牌刷新功能。

## 1. 模块结构

```mermaid
flowchart LR
    subgraph auth["modules/auth"]
        AC["AuthController\nPOST /auth/*"] --> AS["AuthService\n注册/登录/轮换"]
        AS --> TS["TokenService\nES256 签发/验证"]
        AG["AuthGuard（全局）"] --> TS
    end

    AS --> DB["DatabaseService\nUser CRUD"]
    TS --> CFG["constants/auth.constant.ts\nJWT 密钥 + Cookie 配置"]
```

## 2. 双令牌策略

| 属性 | Access Token | Refresh Token |
|------|-------------|---------------|
| 过期 | 15 分钟（`JWT_ACCESS_EXPIRES_IN`）| 7 天（`JWT_REFRESH_EXPIRES_IN`）|
| 算法 | ES256（EC 非对称）| ES256（EC 非对称）|
| 传输 | `Authorization: Bearer <token>` 请求头 | HttpOnly Cookie（名称：`refresh_token`）|
| Claims | `sub, jti(ULID), tokenType:'access', user{...}` | `sub, jti(ULID), tokenType:'refresh'` |

**选择 ES256 的理由**：公钥可安全分发给第三方服务进行本地验证，无需共享签名密钥，支持密钥分离架构。ES256（ECDSA P-256）密钥更短、性能优于 RS256（RSA），HS256 共享密钥无法安全分发。

## 3. JWT Claims 结构

**Access Token** payload：

```typescript
{
  sub: string,            // 用户 ID（ULID）
  iat: number,            // 签发时间戳
  exp: number,            // 过期时间戳
  jti: string,            // 令牌唯一 ID（ULID，防重放）
  tokenType: 'access',
  user: {
    id: string,
    username: string,
    email: string,
    createdAt: string,
    updatedAt: string
    // 不包含 passwordHash
  }
}
```

**Refresh Token** payload（轻量，不含用户详情）：

```typescript
{
  sub: string,
  iat: number,
  exp: number,
  jti: string,
  tokenType: 'refresh'
}
```

## 4. Refresh Token Cookie 配置

Refresh Token 通过 HttpOnly Cookie 传输，防止 XSS 窃取。

| 属性 | 默认值 | 环境变量 |
|------|--------|---------|
| Cookie 名 | `refresh_token` | — |
| HttpOnly | `true` | — |
| Path | `/auth` | `JWT_REFRESH_COOKIE_PATH` |
| SameSite | `lax` | `JWT_REFRESH_COOKIE_SAME_SITE` |
| Secure | `false`（开发）| `JWT_REFRESH_COOKIE_SECURE` |
| 最大寿命 | 604800000ms（7 天）| `JWT_REFRESH_COOKIE_MAX_AGE_MS` |

> 生产环境必须设置 `JWT_REFRESH_COOKIE_SECURE=true`。

## 5. 令牌生命周期

```mermaid
stateDiagram-v2
    [*] --> Issued : 登录 / 注册 / 刷新成功
    Issued --> Valid : 签发后在有效期内
    Valid --> Expired : 超过过期时间
    Valid --> Used : 用于请求认证（access）
    Used --> Valid : 验证通过
    Used --> Invalid : 验证失败（签名错误 / 篡改）
    Expired --> [*] : 需重新登录或刷新
    Invalid --> [*] : 抛出 AUTH_FAILED 401
    Valid --> Rotated : 调用 POST /auth/refresh-token
    Rotated --> [*] : 旧令牌失效，新令牌对签发
```

## 6. API 端点

| 方法 | 路径 | 权限 | 请求体 | 响应 |
|------|------|------|--------|------|
| `POST` | `/auth/register` | `@Public` | `{ username, email, password }` | `{ accessToken, user }` + 设置 Cookie |
| `POST` | `/auth/login` | `@Public` | `{ account, password }` | `{ accessToken, user }` + 设置 Cookie |
| `POST` | `/auth/refresh-token` | `@Public` | Cookie: `refresh_token` | `{ accessToken }` + 更新 Cookie |
| `GET` | `/auth/clear-cookie` | `@Public` | — | 清除 `refresh_token` Cookie |

`account` 字段同时接受 `username` 或 `email`，后端自动判断。

## 7. 令牌刷新流程

```mermaid
flowchart TD
    A["POST /auth/refresh-token"] --> B["读取 Cookie: refresh_token"]
    B --> C{Token 存在?}
    C -- 否 --> ERR["抛出 AUTH_FAILED 401"]
    C -- 是 --> D["TokenService.verifyToken(token, 'refresh')"]
    D --> E{验证通过?}
    E -- 否 --> ERR
    E -- 是 --> F["从 claims.sub 获取 userId"]
    F --> G["DatabaseService.user.findUnique(userId)"]
    G --> H{用户存在?}
    H -- 否 --> ERR
    H -- 是 --> I["issueTokenPair(userId, username)"]
    I --> J["生成新 Access Token（15min）"]
    I --> K["生成新 Refresh Token（7d）\n写入 HttpOnly Cookie"]
    J & K --> L["返回 200 { accessToken }"]
```

## 8. 密码处理

- 加密库：bcryptjs
- 加密成本：10 rounds（`bcrypt.hash(password, 10)`）
- 验证：`bcrypt.compare(inputPassword, storedPasswordHash)`
- 存储字段：`passwordHash`（不在任何响应体或 JWT Claims 中暴露）

## 9. 密钥配置

生产环境必须通过环境变量提供 EC 密钥对（PEM 格式），禁止使用内置的 Dev 默认密钥：

| 环境变量 | 说明 |
|---------|------|
| `JWT_ACCESS_PRIVATE_KEY` | Access Token 签名私钥（EC PEM）|
| `JWT_ACCESS_PUBLIC_KEY` | Access Token 验证公钥（EC PEM）|
| `JWT_REFRESH_PRIVATE_KEY` | Refresh Token 签名私钥（EC PEM）|
| `JWT_REFRESH_PUBLIC_KEY` | Refresh Token 验证公钥（EC PEM）|
| `JWT_ACCESS_EXPIRES_IN` | Access Token 过期（默认 `'15m'`）|
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 过期（默认 `'7d'`）|
