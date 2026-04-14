import { CreateRootDto, UpdateRootDto, RootIdDto, RootListDto } from './root.dto.js';
import { RootService } from './root.service.js';
import ROOT_EXCEPTION from './root.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('房间/位置模块')
@Controller('root')
export class RootController {
    constructor(private readonly rootService: RootService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建房间/位置',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateRootDto) {
        return this.rootService.create(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除房间/位置',
        errors: [
            ROOT_EXCEPTION.RootNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: RootIdDto) {
        await this.rootService.delete(user.sub, body.id);
    }

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取房间/位置详情',
        errors: [ROOT_EXCEPTION.RootNotFoundException.code],
    })
    async getOne(@Query() query: RootIdDto) {
        return this.rootService.getOne(query.id);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织下的房间列表',
    })
    async list(@Query() query: RootListDto) {
        return this.rootService.list(query.orgId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新房间/位置信息',
        errors: [
            ROOT_EXCEPTION.RootNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateRootDto) {
        return this.rootService.update(user.sub, body);
    }
}
