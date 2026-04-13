import { AuthController } from '@/modules/auth/auth.controller.js';
import { AuthService } from '@/modules/auth/services/auth.service.js';

import { REFRESH_TOKEN_COOKIE } from '@/constants/index.js';

import { AlsService } from '@/infra/index.js';

const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    rotateRefreshToken: jest.fn(),
};

const mockAlsService = {
    get: jest.fn(),
};

describe('AuthController (unit)', () => {
    let controller: AuthController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new AuthController(
            mockAuthService as unknown as AuthService,
            mockAlsService as unknown as AlsService
        );
    });

    it('register should set refresh cookie and return auth response', async () => {
        const response: any = { cookie: jest.fn() };
        mockAuthService.register.mockResolvedValue({
            accessToken: 'at-register',
            refreshToken: 'rt-register',
            user: {
                id: 'u1',
                username: 'john',
                email: 'john@example.com',
            },
        });

        const result = await controller.register(
            {
                username: 'john',
                email: 'john@example.com',
                password: 'P@ssw0rd!',
            } as any,
            response
        );

        expect(response.cookie).toHaveBeenCalledWith(
            REFRESH_TOKEN_COOKIE.NAME,
            'rt-register',
            expect.objectContaining({ httpOnly: true })
        );
        expect(result.accessToken).toBe('at-register');
        expect(result.user.username).toBe('john');
    });

    it('login should set refresh cookie and return auth response', async () => {
        const response: any = { cookie: jest.fn() };
        mockAuthService.login.mockResolvedValue({
            accessToken: 'at-login',
            refreshToken: 'rt-login',
            user: {
                id: 'u2',
                username: 'alice',
                email: 'alice@example.com',
            },
        });

        const result = await controller.login(
            {
                account: 'alice@example.com',
                password: 'P@ssw0rd!',
            } as any,
            response
        );

        expect(response.cookie).toHaveBeenCalledTimes(1);
        expect(result.accessToken).toBe('at-login');
        expect(result.user.email).toBe('alice@example.com');
    });

    // Cookie 缺失时的验证由 CookieValidationPipe 负责，不在 controller 层测试

    it('refresh-token should rotate tokens and set cookie', async () => {
        const response: any = { cookie: jest.fn() };
        mockAuthService.rotateRefreshToken.mockResolvedValue({
            accessToken: 'at-new',
            refreshToken: 'rt-new',
        });

        // 单元测试中装饰器被绕过，直接传入 @Cookie('refresh_token') 提取后的字符串
        const result = await controller.refreshToken('rt-old', response);

        expect(mockAuthService.rotateRefreshToken).toHaveBeenCalledWith('rt-old');
        expect(response.cookie).toHaveBeenCalledTimes(1);
        expect(result.accessToken).toBe('at-new');
    });

    it('logout should clear cookie', async () => {
        const response: any = { clearCookie: jest.fn() };

        const result = await controller.logout(response);

        expect(response.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE.NAME, {
            path: REFRESH_TOKEN_COOKIE.PATH,
        });
        expect(result).toBe('ok');
    });
});
