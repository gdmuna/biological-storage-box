import { IdentityKernel } from '@/core/identity/index.js';
import {
    InvalidTokenException,
    MissingTokenException,
} from '@/core/identity/identity.exception.js';
import { AUTH_STRATEGY_KEY, AUTH_STRATEGY_TYPE } from '@/platform/http/decorators/index.js';
import { extractAccessTokenFromRequest } from '@/shared/utils/index.js';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly identityKernel: IdentityKernel
    ) {}

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<FastifyRequest>();

        const authStrategy = this.reflector.getAllAndOverride<AUTH_STRATEGY_TYPE>(
            AUTH_STRATEGY_KEY,
            [context.getHandler(), context.getClass()]
        );

        const accessToken = extractAccessTokenFromRequest(request);

        if (authStrategy === 'public') return true;

        if (authStrategy === 'optional') {
            if (!accessToken) return true;

            const claim = this.identityKernel.verifyAccessToken(accessToken);
            if (!claim) return true;

            request.jwtClaim = claim;
            return true;
        }

        if (!accessToken) {
            throw new MissingTokenException();
        }

        const claim = this.identityKernel.verifyAccessToken(accessToken);
        if (!claim) {
            throw new InvalidTokenException();
        }

        request.jwtClaim = claim;
        return true;
    }
}
