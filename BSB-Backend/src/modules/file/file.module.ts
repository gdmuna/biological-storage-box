import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';

import { StorageModule } from '@/infra/index.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [StorageModule],
    controllers: [FileController],
    providers: [FileService],
    exports: [FileService],
})
export class FileModule {}
