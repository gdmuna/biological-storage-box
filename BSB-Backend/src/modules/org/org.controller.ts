import { CreateOrgDto, UpdateOrgDto, OrgIdDto, SearchOrgDto } from './org.dto.js';
import { OrgService } from './org.service.js';
import ORG_EXCEPTION from './org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('组织模块')
@Controller('org')
export class OrgController {
    constructor(private readonly orgService: OrgService) {}

    @Post('create')
    @ApiRoute({
        auth: 'required',
        summary: '创建组织',
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateOrgDto) {
        return this.orgService.create(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除组织',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotOwnerException.code],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgIdDto) {
        await this.orgService.delete(user.sub, body.orgId);
    }

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织详情',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code],
    })
    async getOne(@Query() query: OrgIdDto) {
        return this.orgService.getOne(query.orgId);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取用户所属组织列表',
    })
    async list(@CurrentUser() user: AccessTokenClaim) {
        return this.orgService.list(user.sub);
    }

    @Get('search')
    @ApiRoute({
        auth: 'required',
        summary: '搜索组织',
    })
    async search(@Query() query: SearchOrgDto) {
        return this.orgService.search(query.keyword, query.limit);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新组织信息',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateOrgDto) {
        return this.orgService.update(user.sub, body);
    }
}
