import { FileRepository } from './internal/file.repository.js';
import { DocumentStrategy } from './internal/strategies/document.strategy.js';
import { ImageStrategy } from './internal/strategies/image.strategy.js';
import { VideoStrategy } from './internal/strategies/video.strategy.js';
import { FileKernel } from './file.kernel.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [FileKernel, FileRepository, DocumentStrategy, ImageStrategy, VideoStrategy],
    exports: [FileKernel],
})
export class FileKernelModule {}
