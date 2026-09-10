import { IdentityRepository } from './internal/identity.repository.js';
import { TokenService } from './internal/token.service.js';
import { IdentityKernel } from './identity.kernel.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [IdentityKernel, IdentityRepository, TokenService],
    exports: [IdentityKernel],
})
export class IdentityKernelModule {}
