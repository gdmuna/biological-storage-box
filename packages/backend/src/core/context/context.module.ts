import { RequestContextService } from './request-context.service.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [RequestContextService],
    exports: [RequestContextService],
})
export class ContextModule {}
