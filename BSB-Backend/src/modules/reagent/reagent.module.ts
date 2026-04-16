import { ReagentController } from './reagent.controller.js';
import { ReagentService } from './reagent.service.js';
import { ReagentRepository } from './reagent.repository.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [ReagentController],
    providers: [ReagentService, ReagentRepository],
    exports: [ReagentService, ReagentRepository],
})
export class ReagentModule {}
