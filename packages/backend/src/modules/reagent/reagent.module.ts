import { ReagentController } from './reagent.controller.js';
import { ReagentService } from './internal/reagent.service.js';
import { ReagentRepository } from './internal/reagent.repository.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [ReagentController],
    providers: [ReagentService, ReagentRepository],
})
export class ReagentModule {}
