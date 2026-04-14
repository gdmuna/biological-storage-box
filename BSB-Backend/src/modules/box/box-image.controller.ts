import {
    CreateBoxImageDto,
    BoxImageIdDto,
    BoxImageListDto,
    BoxImageCompareDto,
} from './box.dto.js';
import { BoxService } from './box.service.js';
import BOX_EXCEPTION from './box.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('储存盒图片模块')
@Controller('box/image')
export class BoxImageController {
    constructor(private readonly boxService: BoxService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '上传储存盒图片',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateBoxImageDto) {
        return this.boxService.createImage(user.sub, body);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取储存盒图片列表',
    })
    async list(@Query() query: BoxImageListDto) {
        return this.boxService.listImages(query.boxId);
    }

    @Post('compare')
    @ApiRoute({
        auth: 'required',
        summary: '储存盒图片比对',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async compare(@Body() body: BoxImageCompareDto) {
        return this.boxService.compareImage(body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除储存盒图片',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: BoxImageIdDto) {
        await this.boxService.deleteImage(user.sub, body.id);
    }
}
