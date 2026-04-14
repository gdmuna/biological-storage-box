import { RootController } from './root.controller.js';
import { RootService } from './root.service.js';
import { RootRepository } from './root.repository.js';

import { OrgModule } from '@/modules/org/org.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [RootController],
    providers: [RootService, RootRepository],
    exports: [RootService, RootRepository],
})
export class RootModule {}
