import { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '@/constants/index.js';

/**
 * 从 Bearer 格式字符串中提取 token。
 *
 * @param payload 形如 `Bearer <token>` 的认证字符串。
 * @returns 提取到的 token；若格式不匹配则返回 `null`。
 */
export function extractToken(payload: string) {
    const match = payload.match(/^Bearer[ ](.+)$/);
    return match ? match[1] : null;
}

/**
 * 从请求头中提取 Access Token。
 *
 * @param request Express 请求对象。
 * @returns 提取到的 Bearer Token；若不存在则返回 null。
 * @example
 * const token = authService.extractAccessTokenFromRequest(request);
 */
export function extractAccessTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader) return null;
    return extractToken(authHeader);
}

/**
 * 从请求 Cookie 中提取 Refresh Token。
 *
 * @param request Express 请求对象。
 * @returns 提取到的 Refresh Token；若不存在则返回 null。
 * @example
 * const refreshToken = authService.extractRefreshTokenFromRequest(request);
 */
export function extractRefreshTokenFromRequest(request: Request): string | null {
    return request.cookies?.[REFRESH_TOKEN_COOKIE.NAME] || null;
}
