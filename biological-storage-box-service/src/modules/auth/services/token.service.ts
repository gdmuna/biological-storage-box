import { AllConfig } from '@/constants/index.js';

import { User } from '@root/prisma/generated/client.js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import jwt, { SignOptions } from 'jsonwebtoken';
import { ulid } from 'ulid';

export type TokenType = 'access' | 'refresh';

interface JwtClaim {
    sub: string;
    iat: number;
    exp: number;
    jti: string;
    tokenType: TokenType;
}

export interface AccessTokenClaim extends JwtClaim {
    tokenType: 'access';
    user: Omit<User, 'passwordHash'>;
}

export interface RefreshTokenClaim extends JwtClaim {
    tokenType: 'refresh';
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class TokenService {
    constructor(private readonly configService: ConfigService<AllConfig, true>) {}

    /**
     * 校验并解析 JWT，同时校验 tokenType 是否匹配预期。
     *
     * @param token 需要校验的 JWT。
     * @param expectedTokenType 预期的令牌类型。
     * @returns 校验通过的声明对象；失败时返回 null。
     * @example
     * const claim = authService['verifyToken'](token, 'refresh');
     */
    verifyToken(token: string, expectedTokenType: 'access'): AccessTokenClaim | null;
    verifyToken(token: string, expectedTokenType: 'refresh'): RefreshTokenClaim | null;
    verifyToken(token: string, expectedTokenType: TokenType) {
        try {
            const tokenConfig =
                expectedTokenType === 'access'
                    ? this.configService.get('auth.accessToken', { infer: true })
                    : this.configService.get('auth.refreshToken', { infer: true });
            const decoded = jwt.verify(token, tokenConfig.publicKey, {
                algorithms: [tokenConfig.algorithm],
            });

            if (typeof decoded === 'string') {
                return null;
            }

            // 检查 tokenType 字段是否匹配
            if (decoded.tokenType !== expectedTokenType) {
                return null;
            }

            return decoded;
        } catch {
            return null;
        }
    }

    /**
     * 生成 Access/Refresh Token 对及其过期信息。
     *
     * @param payload 令牌签发所需信息，如用户 ID 和用户名。
     * @returns 访问令牌、刷新令牌、刷新令牌过期时间
     * @example
     * const pair = authService['issueTokenPair']({
     *   userId: 'u_1',
     *   username: 'demo',
     * });
     */
    issueTokenPair(payload: { userId: string; username: string }): TokenPair {
        const accessToken = this.signToken({
            userId: payload.userId,
            username: payload.username,
            tokenType: 'access',
        });
        const refreshToken = this.signToken({
            userId: payload.userId,
            username: payload.username,
            tokenType: 'refresh',
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    /**
     * 按 token 类型签发 JWT。
     *
     * @param payload 令牌载荷。
     * @returns 签名后的 JWT 字符串。
     * @example
     * const accessToken = authService['signToken']({
     *   userId: 'u_1',
     *   username: 'demo',
     *   tokenType: 'access',
     * });
     */
    private signToken(payload: { userId: string; username: string; tokenType: TokenType }): string {
        const tokenConfig =
            payload.tokenType === 'access'
                ? this.configService.get('auth.accessToken', { infer: true })
                : this.configService.get('auth.refreshToken', { infer: true });

        return jwt.sign(
            {
                sub: payload.userId,
                jti: ulid(),
                tokenType: payload.tokenType,
            },
            tokenConfig.privateKey,
            {
                algorithm: tokenConfig.algorithm,
                expiresIn: tokenConfig.expiresIn as SignOptions['expiresIn'],
            }
        );
    }
}
