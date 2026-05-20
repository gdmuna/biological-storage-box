import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be declared before imports that use the module
vi.mock('@/api/client', () => ({
    alovaInstance: {
        Get: vi.fn(),
        Post: vi.fn(),
        Put: vi.fn(),
        Delete: vi.fn(),
    },
}));

import { alovaInstance } from '@/api/client';
import { login, register, logout, getMyInfo } from '@/api/modules/auth';

describe('auth API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('calls Post with /auth/login and credentials', () => {
            const data = { account: 'testuser', password: 'password123' };
            login(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/auth/login', data);
        });

        it('returns the method object from alovaInstance', () => {
            const mockMethod = { send: vi.fn() };
            vi.mocked(alovaInstance.Post).mockReturnValueOnce(mockMethod as any);
            const result = login({ account: 'user', password: 'pass1234' });
            expect(result).toBe(mockMethod);
        });
    });

    describe('register', () => {
        it('calls Post with /auth/register and user data', () => {
            const data = { username: 'newuser', email: 'new@example.com', password: 'password123' };
            register(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/auth/register', data);
        });
    });

    describe('logout', () => {
        it('calls Get with /auth/clear-cookie', () => {
            logout();
            expect(alovaInstance.Get).toHaveBeenCalledWith('/auth/clear-cookie');
        });
    });

    describe('getMyInfo', () => {
        it('calls Get with /user/info', () => {
            getMyInfo();
            expect(alovaInstance.Get).toHaveBeenCalledWith('/user/info');
        });
    });
});
