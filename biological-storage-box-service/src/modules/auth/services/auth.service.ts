import { LoginDto, RegisterDto } from '../auth.dto.js';
import { TokenService } from './token.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { AllConfig } from '@/constants/index.js';

import {
    DuplicateUserException,
    InvalidCredentialsException,
    InvalidTokenException,
} from '../auth.exception.js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';

interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService<AllConfig, true>
    ) {}

    /**
     * 注册新用户并签发初始 Token 对。
     *
     * @param payload 注册参数。
     * @returns 包含访问令牌、刷新令牌与用户信息的认证结果。
     * @example
     * const result = await authService.register({
     *   username: 'demo',
     *   email: 'demo@example.com',
     *   password: 'P@ssw0rd',
     * });
     */
    async register(payload: RegisterDto): Promise<AuthResult> {
        const username = payload.username.trim().toLowerCase();
        const email = payload.email.trim().toLowerCase();

        const duplicateUser = await this.databaseService.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (duplicateUser) {
            throw new DuplicateUserException();
        }

        const passwordHash = await bcrypt.hash(
            payload.password,
            this.configService.get('auth.bcryptSaltRound', { infer: true })
        );
        const user = await this.databaseService.user.create({
            data: {
                username,
                email,
                passwordHash,
            },
        });

        const tokens = this.tokenService.issueTokenPair({
            userId: user.id,
            username: user.username,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }

    /**
     * 使用账号密码登录并签发新的 Token 对。
     *
     * @param payload 登录参数。
     * @returns 包含访问令牌、刷新令牌与用户信息的认证结果。
     * @example
     * const result = await authService.login({
     *   account: 'demo@example.com',
     *   password: 'P@ssw0rd',
     * });
     */
    async login(payload: LoginDto): Promise<AuthResult> {
        const user = await this.findUserByAccount(payload.account);
        if (!user) {
            throw new InvalidCredentialsException();
        }

        const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new InvalidCredentialsException();
        }

        const tokens = this.tokenService.issueTokenPair({
            userId: user.id,
            username: user.username,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }

    /**
     * 轮换 Refresh Token，并返回新的 Token 对。
     *
     * @param refreshToken 旧的刷新令牌明文。
     * @returns 新的访问令牌与刷新令牌。
     * @example
     * const tokens = await authService.rotateRefreshToken(oldRefreshToken);
     */
    async rotateRefreshToken(refreshToken: string) {
        const refreshClaim = this.tokenService.verifyToken(refreshToken, 'refresh');
        if (!refreshClaim) {
            throw new InvalidTokenException();
        }
        const user = await this.databaseService.user.findUnique({
            where: { id: refreshClaim.sub },
        });
        if (!user) {
            throw new InvalidTokenException();
        }
        return this.tokenService.issueTokenPair({
            userId: user.id,
            username: user.username,
        });
    }

    /**
     * 通过用户名或邮箱查找用户。
     *
     * @param account 用户输入的账号（用户名或邮箱）。
     * @returns 匹配到的用户记录；若不存在则返回 null。
     * @example
     * const user = await authService['findUserByAccount']('demo@example.com');
     */
    private async findUserByAccount(account: string) {
        const normalizedAccount = account.trim().toLowerCase();

        return this.databaseService.user.findFirst({
            where: {
                OR: [
                    { username: { equals: normalizedAccount, mode: 'insensitive' } },
                    { email: { equals: normalizedAccount, mode: 'insensitive' } },
                ],
            },
        });
    }
}
