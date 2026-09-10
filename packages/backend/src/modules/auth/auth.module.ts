import { AuthController } from './auth.controller.js';

import { IdentityKernelModule } from '@/core/identity/identity-kernel.module.js';
import { AuthGuard } from '@/platform/http/guards/auth.guard.js';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [IdentityKernelModule],
    controllers: [AuthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AuthModule {}
