import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';
import { FileRepository } from './file.repository.js';
import {
    DocumentStrategy,
    ImageStrategy,
    VideoStrategy,
    NewVideoStrategy,
} from './strategies/index.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [FileController],
    providers: [
        FileService,
        FileRepository,
        DocumentStrategy,
        ImageStrategy,
        VideoStrategy,
        NewVideoStrategy,
    ],
    exports: [FileService, FileRepository],
})
export class FileModule {}
