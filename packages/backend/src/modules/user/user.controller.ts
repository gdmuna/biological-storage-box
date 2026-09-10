import {
    UserInfoDto,
    UpdateUserInfoDto,
    UpdatePasswordDto,
    SearchUserDto,
    EmailCodeQueryDto,
    EmailLoginDto,
    UpdateEmailDto,
    EmailUpdatePasswordDto,
    SendEmailCodeVo,
    SearchUserResultVo,
} from './user.dto.js';
import { AuthResponseDto } from '@/modules/auth/auth.dto.js';
import { UserService } from './internal/user.service.js';
import USER_EXCEPTION from './user.exception.js';

import { ApiRoute, CurrentUser } from '@/platform/http/decorators/index.js';
import type { AccessTokenClaim } from '@/core/identity/index.js';
import { REFRESH_TOKEN_COOKIE } from '@/config/auth.config.js';

import { Controller, Get, Put, Post, Body, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('用户模块')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('info')
    @ApiRoute({
        auth: 'required',
        summary: '获取当前用户信息',
        responseType: UserInfoDto,
        errors: [USER_EXCEPTION.UserNotFoundException.code],
    })
    async getMyInfo(@CurrentUser() user: AccessTokenClaim) {
        return this.userService.getMyInfo(user.sub);
    }

    @Put('update/info')
    @ApiRoute({
        auth: 'required',
        summary: '修改个人信息',
        responseType: UserInfoDto,
        errors: [USER_EXCEPTION.UserNotFoundException.code],
    })
    async updateInfo(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateUserInfoDto) {
        return this.userService.updateInfo(user.sub, body);
    }

    @Put('update/password')
    @ApiRoute({
        auth: 'required',
        summary: '修改密码',
        errors: [
            USER_EXCEPTION.UserNotFoundException.code,
            USER_EXCEPTION.OldPasswordWrongException.code,
        ],
    })
    async updatePassword(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdatePasswordDto) {
        await this.userService.updatePassword(user.sub, body);
    }

    @Get('email/code')
    @ApiRoute({
        auth: 'public',
        summary: '发送邮箱验证码',
        responseType: SendEmailCodeVo,
    })
    async sendEmailCode(@Query() query: EmailCodeQueryDto) {
        return this.userService.sendEmailCode(query.email);
    }

    @Post('email/login')
    @ApiRoute({
        auth: 'public',
        summary: '邮箱验证码登录',
        responseType: AuthResponseDto,
        errors: [
            USER_EXCEPTION.UserNotFoundException.code,
            USER_EXCEPTION.VerificationCodeInvalidException.code,
            USER_EXCEPTION.VerificationCodeExpiredException.code,
        ],
    })
    async emailLogin(
        @Body() body: EmailLoginDto,
        @Res({ passthrough: true }) response: FastifyReply
    ) {
        const result = await this.userService.emailLogin(body.email, body.code);
        response.setCookie(REFRESH_TOKEN_COOKIE.NAME, result.refreshToken, {
            httpOnly: REFRESH_TOKEN_COOKIE.HTTP_ONLY,
            sameSite: REFRESH_TOKEN_COOKIE.SAME_SITE,
            secure: REFRESH_TOKEN_COOKIE.SECURE,
            path: REFRESH_TOKEN_COOKIE.PATH,
            maxAge: REFRESH_TOKEN_COOKIE.MAX_AGE_MS,
        });
        return { accessToken: result.accessToken, user: result.user };
    }

    @Put('update/email')
    @ApiRoute({
        auth: 'required',
        summary: '修改邮箱',
        responseType: UserInfoDto,
        errors: [USER_EXCEPTION.UserNotFoundException.code, USER_EXCEPTION.EmailSameException.code],
    })
    async updateEmail(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateEmailDto) {
        return this.userService.updateEmail(user.sub, body.email, body.code);
    }

    @Put('email/update/password')
    @ApiRoute({
        auth: 'public',
        summary: '邮箱验证码修改密码',
        errors: [USER_EXCEPTION.UserNotFoundException.code],
    })
    async emailUpdatePassword(@Body() body: EmailUpdatePasswordDto) {
        await this.userService.emailUpdatePassword(body.email, body.code, body.newPassword);
    }

    @Get('search')
    @ApiRoute({
        auth: 'required',
        summary: '搜索用户',
        responseType: [SearchUserResultVo],
    })
    async searchUsers(@CurrentUser() user: AccessTokenClaim, @Query() query: SearchUserDto) {
        return this.userService.searchUsers(query.keyword, user.sub, query.limit);
    }
}
