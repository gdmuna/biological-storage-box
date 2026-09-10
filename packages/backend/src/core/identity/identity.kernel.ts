import { IdentityRepository } from './internal/identity.repository.js';
import { TokenService } from './internal/token.service.js';
import type {
    AccessTokenClaim,
    IdentitySession,
    IssueSessionCommand,
    PasswordLoginCommand,
    PasswordRegistrationCommand,
    TokenPair,
} from './identity.types.js';

import { AllConfig } from '@/config/index.js';
import {
    DuplicateUserException,
    InvalidCredentialsException,
    InvalidTokenException,
} from '@/core/identity/identity.exception.js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';

/**
 * Stable identity boundary for the rest of the application.
 *
 * Local-password authentication is the current implementation. Future external
 * identity providers may be added internally without exposing their clients to
 * HTTP modules or business modules.
 */
@Injectable()
export class IdentityKernel {
    constructor(
        private readonly identityRepository: IdentityRepository,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService<AllConfig, true>
    ) {}

    async registerPassword(payload: PasswordRegistrationCommand): Promise<IdentitySession> {
        const username = payload.username.trim().toLowerCase();
        const email = payload.email.trim().toLowerCase();

        if (await this.identityRepository.findDuplicate(username, email)) {
            throw new DuplicateUserException();
        }

        const passwordHash = await bcrypt.hash(
            payload.password,
            this.configService.get('auth.bcryptSaltRound', { infer: true })
        );
        const user = await this.identityRepository.createPasswordAccount({
            username,
            email,
            passwordHash,
        });

        return {
            ...this.issueSession({ userId: user.id, username: user.username }),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }

    async authenticatePassword(payload: PasswordLoginCommand): Promise<IdentitySession> {
        const user = await this.identityRepository.findByAccount(
            payload.account.trim().toLowerCase()
        );
        if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
            throw new InvalidCredentialsException();
        }

        return {
            ...this.issueSession({ userId: user.id, username: user.username }),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }

    async rotateRefreshSession(refreshToken: string): Promise<TokenPair> {
        const refreshClaim = this.tokenService.verifyToken(refreshToken, 'refresh');
        if (!refreshClaim) {
            throw new InvalidTokenException();
        }

        const user = await this.identityRepository.findById(refreshClaim.sub);
        if (!user) {
            throw new InvalidTokenException();
        }

        return this.issueSession({ userId: user.id, username: user.username });
    }

    issueSession(command: IssueSessionCommand): TokenPair {
        return this.tokenService.issueTokenPair(command);
    }

    verifyAccessToken(token: string): AccessTokenClaim | null {
        return this.tokenService.verifyToken(token, 'access');
    }
}
