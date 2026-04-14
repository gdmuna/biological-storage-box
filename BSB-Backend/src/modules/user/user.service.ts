import { UpdateUserInfoDto, UpdatePasswordDto } from './user.dto.js';
import { UserRepository } from './user.repository.js';
import {
    UserNotFoundException,
    OldPasswordWrongException,
    EmailSameException,
} from './user.exception.js';

import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from '@/constants/index.js';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService<AllConfig, true>
    ) {}

    async getMyInfo(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new UserNotFoundException();
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }

    async updateInfo(userId: string, dto: UpdateUserInfoDto) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new UserNotFoundException();
        const updated = await this.userRepository.update(userId, {
            ...(dto.nickname !== undefined && { nickname: dto.nickname }),
            ...(dto.realname !== undefined && { realname: dto.realname }),
        });
        const { passwordHash: _, ...safeUser } = updated;
        return safeUser;
    }

    async updatePassword(userId: string, dto: UpdatePasswordDto) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new UserNotFoundException();
        const match = await bcrypt.compare(dto.oldPassword, user.passwordHash);
        if (!match) throw new OldPasswordWrongException();
        const saltRounds = this.configService.get('auth.bcryptSaltRound', { infer: true });
        const newHash = await bcrypt.hash(dto.newPassword, saltRounds);
        await this.userRepository.update(userId, { passwordHash: newHash });
    }

    async searchUsers(keyword: string, currentUserId: string, limit: number) {
        return this.userRepository.search(keyword, currentUserId, limit);
    }

    // ── 邮箱相关（验证码为 stub 实现）──────────────────────

    async sendEmailCode(_email: string) {
        // TODO: 接入真实邮件服务，当前返回 stub
        return { sent: true };
    }

    async emailLogin(_email: string, _code: string) {
        // TODO: 接入真实验证码校验
        throw new Error('Email login not yet implemented');
    }

    async updateEmail(userId: string, newEmail: string, _code: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new UserNotFoundException();
        if (user.email === newEmail) throw new EmailSameException();
        // TODO: 验证码校验
        const updated = await this.userRepository.update(userId, { email: newEmail });
        const { passwordHash: _, ...safeUser } = updated;
        return safeUser;
    }

    async emailUpdatePassword(_email: string, _code: string, newPassword: string) {
        // TODO: 验证码校验后，根据 email 找到用户修改密码
        const user = await this.userRepository.findByEmail(_email);
        if (!user) throw new UserNotFoundException();
        const saltRounds = this.configService.get('auth.bcryptSaltRound', { infer: true });
        const newHash = await bcrypt.hash(newPassword, saltRounds);
        await this.userRepository.update(user.id, { passwordHash: newHash });
    }
}
