import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [FileController],
    providers: [FileService],
    exports: [FileService],
})
export class FileModule {}
