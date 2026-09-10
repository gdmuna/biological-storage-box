import { UserController } from './user.controller.js';
import { UserService } from './internal/user.service.js';
import { UserRepository } from './internal/user.repository.js';
import { EmailVerificationRepository } from './internal/email-verification.repository.js';
import { IdentityKernelModule } from '@/core/identity/identity-kernel.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [IdentityKernelModule],
    controllers: [UserController],
    // MailService 通过 @Global() MailModule 自动提供，不需要在此 imports
    providers: [UserService, UserRepository, EmailVerificationRepository],
})
export class UserModule {}
