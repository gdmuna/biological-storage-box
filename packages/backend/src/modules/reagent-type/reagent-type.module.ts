import { ReagentTypeController } from './reagent-type.controller.js';
import { ReagentTypeService } from './internal/reagent-type.service.js';
import { ReagentTypeRepository } from './internal/reagent-type.repository.js';
import { OrgModule } from '@/modules/org/org.module.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [ReagentTypeController],
    providers: [ReagentTypeService, ReagentTypeRepository],
})
export class ReagentTypeModule {}
