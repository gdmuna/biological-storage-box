import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { EmailVerificationRepository } from './email-verification.repository.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [UserController],
    // MailService 通过 @Global() MailModule 自动提供，不需要在此 imports
    providers: [UserService, UserRepository, EmailVerificationRepository],
    exports: [UserService, UserRepository],
})
export class UserModule {}
