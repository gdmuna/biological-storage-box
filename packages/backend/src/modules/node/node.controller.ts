import {
    CreateNodeDto,
    UpdateNodeDto,
    NodeIdDto,
    NodeTreeDto,
    SetGridConfigDto,
    RemoveGridConfigDto,
    NodeVo,
    NodeGridConfigVo,
    AddNodeImageDto,
    RemoveNodeImageDto,
    NodeImageVo,
} from './node.dto.js';
import { NodeService } from './internal/node.service.js';
import NODE_EXCEPTION from './node.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/platform/http/decorators/index.js';
import type { AccessTokenClaim } from '@/core/identity/index.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('节点/位置模块')
@Controller('node')
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建节点',
        responseType: NodeVo,
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

    @Get('tree')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织完整节点树（扁平数组，前端自行构建树）',
        responseType: [NodeVo],
    })
    async getTree(@Query() query: NodeTreeDto) {
        return this.nodeService.getTree(query.orgId);
    }

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取单个节点详情',
        responseType: NodeVo,
        errors: [NODE_EXCEPTION.NodeNotFoundException.code],
    })
    async getOne(@Query() query: NodeIdDto) {
        return this.nodeService.getOne(query.id);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新节点信息（可移动到其他父节点）',
        responseType: NodeVo,
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
        responseType: NodeGridConfigVo,
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

    // ─── 图片 ──────────────────────────────────────────────────────────────────

    @Post('image/add')
    @ApiRoute({
        auth: 'required',
        summary: '为节点添加图片',
        description:
            '将已上传至存储服务的图片 URL 关联到节点，生成 NodeImage 记录。客户端应先通过 FileService presign 上传文件，确认后再调用此接口。',
        responseType: NodeImageVo,
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async addImage(@CurrentUser() user: AccessTokenClaim, @Body() body: AddNodeImageDto) {
        return this.nodeService.addImage(user.sub, body);
    }

    @Delete('image/remove')
    @ApiRoute({
        auth: 'required',
        summary: '删除节点图片',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async removeImage(@CurrentUser() user: AccessTokenClaim, @Body() body: RemoveNodeImageDto) {
        await this.nodeService.removeImage(user.sub, body);
    }
}
