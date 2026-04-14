import { CreateBoxAliasDto, UpdateBoxAliasDto, BoxAliasIdDto, BoxAliasListDto } from './box.dto.js';
import { BoxService } from './box.service.js';
import BOX_EXCEPTION from './box.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('储存盒别名模块')
@Controller('box/alias')
export class BoxAliasController {
    constructor(private readonly boxService: BoxService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建储存盒别名',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateBoxAliasDto) {
        return this.boxService.createAlias(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除储存盒别名',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: BoxAliasIdDto) {
        await this.boxService.deleteAlias(user.sub, body.id);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取储存盒别名列表',
    })
    async list(@Query() query: BoxAliasListDto) {
        return this.boxService.listAliases(query.boxId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新储存盒别名',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateBoxAliasDto) {
        return this.boxService.updateAlias(user.sub, body);
    }
}
