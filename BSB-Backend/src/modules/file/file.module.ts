import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';
import { FileRepository } from './file.repository.js';
import { DocumentStrategy, ImageStrategy, VideoStrategy } from './strategies/index.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [FileController],
    providers: [FileService, FileRepository, DocumentStrategy, ImageStrategy, VideoStrategy],
    exports: [FileService, FileRepository],
})
export class FileModule {}
