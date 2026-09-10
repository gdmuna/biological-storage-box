import { DiagnosticsController, OperationsController } from './operations.controller.js';
import { OperationsService } from './operations.service.js';

import { ContextModule } from '@/core/context/context.module.js';
import { DatabaseModule } from '@/infra/database/database.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [ContextModule, DatabaseModule],
    controllers: [OperationsController, DiagnosticsController],
    providers: [OperationsService],
})
export class OperationsModule {}
