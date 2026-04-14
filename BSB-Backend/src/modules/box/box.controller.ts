import {
    CreateBoxDto,
    UpdateBoxDto,
    BoxIdDto,
    BoxListDto,
    BoxSearchDto,
    BoxRootListDto,
} from './box.dto.js';
import { BoxService } from './box.service.js';
import BOX_EXCEPTION from './box.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('储存盒模块')
@Controller('box')
export class BoxController {
    constructor(private readonly boxService: BoxService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建储存盒',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateBoxDto) {
        return this.boxService.create(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除储存盒',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: BoxIdDto) {
        await this.boxService.delete(user.sub, body.id);
    }

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取储存盒详情',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code],
    })
    async getOne(@Query() query: BoxIdDto) {
        return this.boxService.getOne(query.id);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织下的储存盒列表',
    })
    async list(@Query() query: BoxListDto) {
        return this.boxService.list(query.orgId);
    }

    @Get('root/list')
    @ApiRoute({
        auth: 'required',
        summary: '按 Root 分组获取储存盒列表',
    })
    async listGroupedByRoot(@Query() query: BoxRootListDto) {
        return this.boxService.listGroupedByRoot(query.orgId);
    }

    @Get('search')
    @ApiRoute({
        auth: 'required',
        summary: '搜索储存盒',
    })
    async search(@Query() query: BoxSearchDto) {
        return this.boxService.search(query);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新储存盒信息',
        errors: [BOX_EXCEPTION.BoxNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateBoxDto) {
        return this.boxService.update(user.sub, body);
    }
}
