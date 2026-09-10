import {
    CreateOrgDto,
    UpdateOrgDto,
    OrgIdDto,
    SearchOrgDto,
    ExploreOrgDto,
    MemberSearchDto,
    OrgVo,
    OrgDetailVo,
    OrgListItemVo,
    OrgSearchResultVo,
    OrgExploreItemVo,
    OrgMemberWithUserVo,
} from './org.dto.js';
import { OrgService } from './internal/org.service.js';
import ORG_EXCEPTION from './org.exception.js';

import { ApiRoute, CurrentUser } from '@/platform/http/decorators/index.js';
import type { AccessTokenClaim } from '@/core/identity/index.js';

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
        responseType: OrgVo,
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
        responseType: OrgDetailVo,
        errors: [ORG_EXCEPTION.OrgNotFoundException.code],
    })
    async getOne(@Query() query: OrgIdDto) {
        return this.orgService.getOne(query.orgId);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取用户所属组织列表',
        responseType: [OrgListItemVo],
    })
    async list(@CurrentUser() user: AccessTokenClaim) {
        return this.orgService.list(user.sub);
    }

    @Get('search')
    @ApiRoute({
        auth: 'required',
        summary: '搜索组织',
        responseType: [OrgSearchResultVo],
    })
    async search(@Query() query: SearchOrgDto) {
        return this.orgService.search(query.keyword, query.limit);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新组织信息',
        responseType: OrgVo,
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateOrgDto) {
        return this.orgService.update(user.sub, body);
    }

    @Get('explore')
    @ApiRoute({
        auth: 'required',
        summary: '探索公开组织列表（支持分页与关键词搜索）',
        responseType: [OrgExploreItemVo],
    })
    async explore(@Query() query: ExploreOrgDto) {
        return this.orgService.explore(query.keyword, query.limit, query.offset);
    }

    @Get('members/search')
    @ApiRoute({
        auth: 'required',
        summary: '在组织内按 username/email 搜索成员',
        responseType: [OrgMemberWithUserVo],
        errors: [ORG_EXCEPTION.OrgNotMemberException.code],
    })
    async searchMembers(@CurrentUser() user: AccessTokenClaim, @Query() query: MemberSearchDto) {
        return this.orgService.searchMembers(user.sub, query.orgId, query.keyword);
    }
}
