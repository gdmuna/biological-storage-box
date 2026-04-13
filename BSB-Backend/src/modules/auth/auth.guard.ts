import { TokenService } from './services/index.js';

import { AUTH_STRATEGY_KEY, AUTH_STRATEGY_TYPE } from '@/common/decorators/index.js';
import { extractAccessTokenFromRequest } from '@/common/utils/index.js';
import { InvalidTokenException, MissingTokenException } from './auth.exception.js';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly tokenService: TokenService
    ) {}

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();

        const authStrategy = this.reflector.getAllAndOverride<AUTH_STRATEGY_TYPE>(
            AUTH_STRATEGY_KEY,
            [context.getHandler(), context.getClass()]
        );

        const accessToken = extractAccessTokenFromRequest(request);

        if (authStrategy === 'public') return true;

        if (authStrategy === 'optional') {
            if (!accessToken) return true;

            const claim = this.tokenService.verifyToken(accessToken, 'access');
            if (!claim) return true;

            request.jwtClaim = claim;
            return true;
        }

        if (!accessToken) {
            throw new MissingTokenException();
        }

        const claim = this.tokenService.verifyToken(accessToken, 'access');
        if (!claim) {
            throw new InvalidTokenException();
        }

        request.jwtClaim = claim;
        return true;
    }
}
