import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
    alovaInstance: {
        Get: vi.fn(),
        Post: vi.fn(),
        Put: vi.fn(),
        Delete: vi.fn(),
    },
}));

import { alovaInstance } from '@/api/client';
import {
    updateUserInfo,
    updatePassword,
    searchUsers,
    sendEmailCode,
    emailLogin,
    updateEmail,
    emailUpdatePassword,
} from '@/api/modules/user';

describe('user API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateUserInfo', () => {
        it('calls Put /user/update/info with nickname', () => {
            const data = { nickname: 'Alex' };
            updateUserInfo(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/update/info', data);
        });

        it('calls Put /user/update/info with realname', () => {
            const data = { realname: 'Alexander Smith' };
            updateUserInfo(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/update/info', data);
        });

        it('calls Put /user/update/info with both fields', () => {
            const data = { nickname: 'Alex', realname: 'Alexander Smith' };
            updateUserInfo(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/update/info', data);
        });

        it('calls Put /user/update/info with empty object', () => {
            updateUserInfo({});
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/update/info', {});
        });
    });

    describe('updatePassword', () => {
        it('calls Put /user/update/password with old and new password', () => {
            const data = { oldPassword: 'old1234!', newPassword: 'new5678!' };
            updatePassword(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/update/password', data);
        });
    });

    describe('searchUsers', () => {
        it('calls Get /user/search with keyword', () => {
            const params = { keyword: 'alex' };
            searchUsers(params);
            expect(alovaInstance.Get).toHaveBeenCalledWith('/user/search', { params });
        });

        it('calls Get /user/search with keyword and limit', () => {
            const params = { keyword: 'alex', limit: 10 };
            searchUsers(params);
            expect(alovaInstance.Get).toHaveBeenCalledWith('/user/search', { params });
        });
    });

    describe('email auth and security flows', () => {
        it('calls Get /user/email/code with email param', () => {
            sendEmailCode('a@b.com');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/user/email/code', {
                params: { email: 'a@b.com' },
            });
        });

        it('calls Post /user/email/login with email and code', () => {
            const data = { email: 'a@b.com', code: '123456' };
            emailLogin(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/user/email/login', data);
        });

        it('calls Put /user/update/email with email and code', () => {
            const data = { email: 'new@b.com', code: '123456' };
            updateEmail(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/update/email', data);
        });

        it('calls Put /user/email/update/password with email, code and password', () => {
            const data = { email: 'a@b.com', code: '123456', newPassword: 'password123' };
            emailUpdatePassword(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/user/email/update/password', data);
        });
    });
});
