import { OrgController } from './org.controller.js';
import { OrgUserController } from './org-user.controller.js';
import { OrgService } from './org.service.js';
import { OrgUserService } from './org-user.service.js';
import { OrgRepository } from './org.repository.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [OrgController, OrgUserController],
    providers: [OrgService, OrgUserService, OrgRepository],
    exports: [OrgService, OrgUserService, OrgRepository],
})
export class OrgModule {}
