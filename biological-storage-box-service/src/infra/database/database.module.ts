import { DatabaseService } from './database.service.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}
