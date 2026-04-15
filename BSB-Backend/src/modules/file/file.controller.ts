import { FileService } from './file.service.js';
import type { UploadFileInput } from './file.service.js';
import { FileExceptionCode } from './file.exception.js';

import { ApiRoute } from '@/common/decorators/index.js';

import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('文件模块')
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @ApiRoute({
        auth: 'required',
        summary: '文件上传',
        consumes: ['multipart/form-data'],
        errors: [FileExceptionCode.SCENE_INVALID, FileExceptionCode.UPLOAD_FAILED],
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '上传文件',
                },
                scene: {
                    type: 'string',
                    enum: ['image', 'file', 'img', 'share'],
                    description: '上传场景。image/img -> img 桶，file/share -> share 桶',
                },
            },
        },
    })
    async upload(@UploadedFile() file: UploadFileInput, @Body('scene') scene?: string) {
        return this.fileService.upload(file, scene);
    }
}
