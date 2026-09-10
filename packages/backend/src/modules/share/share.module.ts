import { ShareController } from './share.controller.js';
import { ShareService } from './internal/share.service.js';
import { ShareRepository } from './internal/share.repository.js';
import { OrgModule } from '@/modules/org/org.module.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [ShareController],
    providers: [ShareService, ShareRepository],
})
export class ShareModule {}
