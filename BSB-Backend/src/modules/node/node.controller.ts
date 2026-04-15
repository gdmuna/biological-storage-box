import {
    CreateNodeDto,
    UpdateNodeDto,
    NodeIdDto,
    NodeListDto,
    NodeTreeDto,
    SetGridConfigDto,
    RemoveGridConfigDto,
    NodeFilterDto,
} from './node.dto.js';
import { NodeService } from './node.service.js';
import NODE_EXCEPTION from './node.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('节点/位置模块')
@Controller('node')
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建节点（根节点或子节点）',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateNodeDto) {
        return this.nodeService.create(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除节点',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: NodeIdDto) {
        await this.nodeService.delete(user.sub, body.id);
    }

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取节点详情（含直接子节点）',
        errors: [NODE_EXCEPTION.NodeNotFoundException.code],
    })
    async getOne(@Query() query: NodeIdDto) {
        return this.nodeService.getOne(query.id);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织下指定父节点的直接子节点列表',
    })
    async list(@Query() query: NodeListDto) {
        return this.nodeService.list(query.orgId, query.parentId);
    }

    @Get('tree')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织完整节点树（4 层深度）',
    })
    async getTree(@Query() query: NodeTreeDto) {
        return this.nodeService.getTree(query.orgId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新节点信息（可移动到其他父节点）',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            NODE_EXCEPTION.NodeCircularReferenceException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateNodeDto) {
        return this.nodeService.update(user.sub, body);
    }

    @Post('grid/set')
    @ApiRoute({
        auth: 'required',
        summary: '设置节点网格配置（使节点可承载试剂槽位）',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async setGridConfig(@CurrentUser() user: AccessTokenClaim, @Body() body: SetGridConfigDto) {
        return this.nodeService.setGridConfig(user.sub, body);
    }

    @Delete('grid/remove')
    @ApiRoute({
        auth: 'required',
        summary: '移除节点网格配置',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async removeGridConfig(
        @CurrentUser() user: AccessTokenClaim,
        @Body() body: RemoveGridConfigDto
    ) {
        await this.nodeService.removeGridConfig(user.sub, body);
    }

    @Get('filter')
    @ApiRoute({
        auth: 'required',
        summary: '按类型/组织/gridConfig 过滤节点列表（供前端过滤器使用）',
    })
    async filter(@Query() query: NodeFilterDto) {
        return this.nodeService.filter({
            orgId: query.orgId,
            type: query.type,
            hasGrid: query.hasGrid,
            parentId: query.parentId,
        });
    }
}
