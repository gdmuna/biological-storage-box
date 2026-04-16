import { ReagentTypeController } from './reagent-type.controller.js';
import { ReagentTypeService } from './reagent-type.service.js';
import { ReagentTypeRepository } from './reagent-type.repository.js';
import { OrgModule } from '@/modules/org/org.module.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [ReagentTypeController],
    providers: [ReagentTypeService, ReagentTypeRepository],
    exports: [ReagentTypeService],
})
export class ReagentTypeModule {}
