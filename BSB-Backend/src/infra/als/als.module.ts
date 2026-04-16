import { AlsService } from './als.service.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [AlsService],
    exports: [AlsService],
})
export class AlsModule {}
