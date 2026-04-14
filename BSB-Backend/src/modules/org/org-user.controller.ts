import { OrgUserActionDto, UpdateAuthorityDto, OrgUserListDto, OrgIdDto } from './org.dto.js';
import { OrgUserService } from './org-user.service.js';
import ORG_EXCEPTION from './org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('组织成员模块')
@Controller('org/user')
export class OrgUserController {
    constructor(private readonly orgUserService: OrgUserService) {}

    @Post('apply')
    @ApiRoute({
        auth: 'required',
        summary: '申请加入组织',
        errors: [
            ORG_EXCEPTION.OrgNotFoundException.code,
            ORG_EXCEPTION.OrgAlreadyMemberException.code,
        ],
    })
    async apply(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgIdDto) {
        return this.orgUserService.apply(user.sub, body.orgId);
    }

    @Post('apply/ac')
    @ApiRoute({
        auth: 'required',
        summary: '接受申请',
        errors: [
            ORG_EXCEPTION.OrgNotAdminException.code,
            ORG_EXCEPTION.ApplicationNotFoundException.code,
        ],
    })
    async acceptApplication(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgUserActionDto) {
        return this.orgUserService.acceptApplication(user.sub, body.orgId, body.userId);
    }

    @Post('apply/ms')
    @ApiRoute({
        auth: 'required',
        summary: '拒绝申请',
        errors: [
            ORG_EXCEPTION.OrgNotAdminException.code,
            ORG_EXCEPTION.ApplicationNotFoundException.code,
        ],
    })
    async rejectApplication(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgUserActionDto) {
        return this.orgUserService.rejectApplication(user.sub, body.orgId, body.userId);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '移除成员',
        errors: [ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async removeMember(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgUserActionDto) {
        await this.orgUserService.removeMember(user.sub, body.orgId, body.userId);
    }

    @Post('invite')
    @ApiRoute({
        auth: 'required',
        summary: '邀请用户加入组织',
        errors: [
            ORG_EXCEPTION.OrgNotAdminException.code,
            ORG_EXCEPTION.OrgAlreadyMemberException.code,
        ],
    })
    async invite(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgUserActionDto) {
        return this.orgUserService.invite(user.sub, body.orgId, body.userId);
    }

    @Post('invite/ac')
    @ApiRoute({
        auth: 'required',
        summary: '接受邀请',
        errors: [ORG_EXCEPTION.ApplicationNotFoundException.code],
    })
    async acceptInvite(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgIdDto) {
        return this.orgUserService.acceptInvite(user.sub, body.orgId);
    }

    @Post('invite/ms')
    @ApiRoute({
        auth: 'required',
        summary: '拒绝邀请',
        errors: [ORG_EXCEPTION.ApplicationNotFoundException.code],
    })
    async rejectInvite(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgIdDto) {
        return this.orgUserService.rejectInvite(user.sub, body.orgId);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取待处理的申请/邀请列表',
    })
    async listPending(@Query() query: OrgUserListDto) {
        return this.orgUserService.listPending(query.orgId);
    }

    @Get('member/list')
    @ApiRoute({
        auth: 'required',
        summary: '获取已加入成员列表',
    })
    async listMembers(@Query() query: OrgUserListDto) {
        return this.orgUserService.listMembers(query.orgId);
    }

    @Delete('quit')
    @ApiRoute({
        auth: 'required',
        summary: '退出组织',
        errors: [ORG_EXCEPTION.OwnerCannotQuitException.code],
    })
    async quit(@CurrentUser() user: AccessTokenClaim, @Body() body: OrgIdDto) {
        await this.orgUserService.quit(user.sub, body.orgId);
    }

    @Put('updateAuthority')
    @ApiRoute({
        auth: 'required',
        summary: '修改成员权限',
        errors: [
            ORG_EXCEPTION.OrgNotOwnerException.code,
            ORG_EXCEPTION.CannotPromoteOwnerException.code,
        ],
    })
    async updateAuthority(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateAuthorityDto) {
        return this.orgUserService.updateAuthority(user.sub, body.orgId, body.userId, body.role);
    }
}
