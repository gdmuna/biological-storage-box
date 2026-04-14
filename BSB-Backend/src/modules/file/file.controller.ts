import { FileService } from './file.service.js';

import { ApiRoute } from '@/common/decorators/index.js';

import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';

@ApiTags('文件模块')
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @ApiRoute({
        auth: 'required',
        summary: '文件上传',
        consumes: ['multipart/form-data'],
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    async upload(@UploadedFile() file: { originalname: string; size: number; buffer: Buffer }) {
        return this.fileService.upload(file);
    }
}
