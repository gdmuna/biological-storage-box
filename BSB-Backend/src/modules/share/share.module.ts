import { ShareController } from './share.controller.js';
import { ShareService } from './share.service.js';
import { ShareRepository } from './share.repository.js';
import { OrgModule } from '@/modules/org/org.module.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [ShareController],
    providers: [ShareService, ShareRepository],
    exports: [ShareService],
})
export class ShareModule {}
