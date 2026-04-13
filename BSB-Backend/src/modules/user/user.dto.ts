import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

// ── 响应 DTO ──────────────────────────────────────────────

const UserInfoDtoSchema = z
    .object({
        id: z.string().meta({ title: '用户 ID', example: '01KN9C2XF9EJHV3P0CAY3NXSMY' }),
        username: z.string().meta({ title: '用户名', example: 'user0' }),
        email: z.email().meta({ title: '邮箱', example: 'user0@example.com' }),
        nickname: z.string().nullable().meta({ title: '昵称' }),
        realname: z.string().nullable().meta({ title: '真实姓名' }),
        createdAt: z.string().meta({ title: '创建时间' }),
    })
    .meta({ description: '用户信息' });

export class UserInfoDto extends createZodDto(UserInfoDtoSchema) {}

// ── 请求 DTO ──────────────────────────────────────────────

const UpdateUserInfoDtoSchema = z
    .object({
        nickname: z.string().max(64).optional().meta({ title: '昵称', example: '小明' }),
        realname: z.string().max(64).optional().meta({ title: '真实姓名', example: '张明' }),
    })
    .meta({ description: '修改个人信息请求体' });

export class UpdateUserInfoDto extends createZodDto(UpdateUserInfoDtoSchema) {}

const UpdatePasswordDtoSchema = z
    .object({
        oldPassword: z.string().min(8).max(128).meta({ title: '旧密码' }),
        newPassword: z.string().min(8).max(128).meta({ title: '新密码' }),
    })
    .meta({ description: '修改密码请求体' });

export class UpdatePasswordDto extends createZodDto(UpdatePasswordDtoSchema) {}

const UpdateEmailDtoSchema = z
    .object({
        email: z.email().meta({ title: '新邮箱', example: 'new@example.com' }),
        code: z.string().min(4).max(8).meta({ title: '验证码', example: '123456' }),
    })
    .meta({ description: '修改邮箱请求体' });

export class UpdateEmailDto extends createZodDto(UpdateEmailDtoSchema) {}

const EmailLoginDtoSchema = z
    .object({
        email: z.email().meta({ title: '邮箱', example: 'user0@example.com' }),
        code: z.string().min(4).max(8).meta({ title: '验证码', example: '123456' }),
    })
    .meta({ description: '邮箱验证码登录请求体' });

export class EmailLoginDto extends createZodDto(EmailLoginDtoSchema) {}

const EmailUpdatePasswordDtoSchema = z
    .object({
        email: z.email().meta({ title: '邮箱', example: 'user0@example.com' }),
        code: z.string().min(4).max(8).meta({ title: '验证码', example: '123456' }),
        newPassword: z.string().min(8).max(128).meta({ title: '新密码' }),
    })
    .meta({ description: '邮箱验证码修改密码请求体' });

export class EmailUpdatePasswordDto extends createZodDto(EmailUpdatePasswordDtoSchema) {}

const SearchUserDtoSchema = z
    .object({
        keyword: z.string().min(1).max(64).meta({ title: '搜索关键词', example: 'user' }),
        limit: z.coerce.number().int().min(1).max(50).default(10).meta({ title: '返回数量' }),
    })
    .meta({ description: '搜索用户查询参数' });

export class SearchUserDto extends createZodDto(SearchUserDtoSchema) {}

const EmailCodeQueryDtoSchema = z
    .object({
        email: z.email().meta({ title: '邮箱', example: 'user0@example.com' }),
    })
    .meta({ description: '发送邮箱验证码查询参数' });

export class EmailCodeQueryDto extends createZodDto(EmailCodeQueryDtoSchema) {}
