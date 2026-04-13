import { AuthGuard } from './auth.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService, TokenService } from './services/index.js';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
    controllers: [AuthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        AuthService,
        TokenService,
    ],
})
export class AuthModule {}
