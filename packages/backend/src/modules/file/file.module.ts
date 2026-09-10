import { FileController } from './file.controller.js';
import { MultipartRequestHandlerFactory } from './internal/multipart-request-handler.js';

import { FileKernelModule } from '@/core/file/file-kernel.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [FileKernelModule],
    controllers: [FileController],
    providers: [MultipartRequestHandlerFactory],
})
export class FileModule {}
