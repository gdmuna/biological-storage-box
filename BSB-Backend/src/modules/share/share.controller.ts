import {
    GrantShareDto,
    RespondShareDto,
    RevokeShareDto,
    ShareListDto,
    ShareVo,
    ShareOutboundItemVo,
    ShareInboundItemVo,
} from './share.dto.js';
import { ShareService } from './share.service.js';
import SHARE_EXCEPTION from './share.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('资源共享模块')
@Controller('share')
export class ShareController {
    constructor(private readonly shareService: ShareService) {}

    @Post('grant')
    @ApiRoute({
        auth: 'required',
        summary: '主动授权：归属组织将资源共享给目标组织',
        responseType: ShareVo,
        errors: [
            ORG_EXCEPTION.OrgNotAdminException.code,
            SHARE_EXCEPTION.ShareAlreadyExistsException.code,
        ],
    })
    async grant(@CurrentUser() user: AccessTokenClaim, @Body() body: GrantShareDto) {
        return this.shareService.grant(user.sub, body);
    }

    @Put('respond')
    @ApiRoute({
        auth: 'required',
        summary: '响应共享申请（批准或拒绝）',
        responseType: ShareVo,
        errors: [
            SHARE_EXCEPTION.ShareNotFoundException.code,
            SHARE_EXCEPTION.ShareNotOwnerException.code,
        ],
    })
    async respond(@CurrentUser() user: AccessTokenClaim, @Body() body: RespondShareDto) {
        return this.shareService.respond(user.sub, body);
    }

    @Delete('revoke')
    @ApiRoute({
        auth: 'required',
        summary: '撤销共享',
        errors: [
            SHARE_EXCEPTION.ShareNotFoundException.code,
            SHARE_EXCEPTION.ShareNotOwnerException.code,
        ],
    })
    async revoke(@CurrentUser() user: AccessTokenClaim, @Body() body: RevokeShareDto) {
        await this.shareService.revoke(user.sub, body.shareId);
    }

    @Get('outbound')
    @ApiRoute({
        auth: 'required',
        summary: '获取我的组织已共享出去的资源列表',
        responseType: [ShareOutboundItemVo],
    })
    async listOutbound(@Query() query: ShareListDto) {
        return this.shareService.listOutbound(query.orgId);
    }

    @Get('inbound')
    @ApiRoute({
        auth: 'required',
        summary: '获取我的组织获得的共享资源列表',
        responseType: [ShareInboundItemVo],
    })
    async listInbound(@Query() query: ShareListDto) {
        return this.shareService.listInbound(query.orgId);
    }
}
