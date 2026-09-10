import { AuthController } from '@/modules/auth/auth.controller.js';

import { IdentityKernel } from '@/core/identity/index.js';
import { REFRESH_TOKEN_COOKIE } from '@/config/index.js';

const identityKernel = {
    registerPassword: vi.fn(),
    authenticatePassword: vi.fn(),
    rotateRefreshSession: vi.fn(),
};

describe('AuthController', () => {
    let controller: AuthController;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new AuthController(identityKernel as unknown as IdentityKernel);
    });

    it('registers, sets the refresh cookie, and returns the HTTP response', async () => {
        const response: any = { setCookie: vi.fn() };
        identityKernel.registerPassword.mockResolvedValue({
            accessToken: 'at-register',
            refreshToken: 'rt-register',
            user: { id: 'u1', username: 'john', email: 'john@example.com' },
        });

        const result = await controller.register(
            { username: 'john', email: 'john@example.com', password: 'P@ssw0rd!' } as never,
            response
        );

        expect(response.setCookie).toHaveBeenCalledWith(
            REFRESH_TOKEN_COOKIE.NAME,
            'rt-register',
            expect.objectContaining({ httpOnly: true })
        );
        expect(result).toMatchObject({ accessToken: 'at-register', user: { username: 'john' } });
    });

    it('logs in through the identity kernel', async () => {
        const response: any = { setCookie: vi.fn() };
        identityKernel.authenticatePassword.mockResolvedValue({
            accessToken: 'at-login',
            refreshToken: 'rt-login',
            user: { id: 'u2', username: 'alice', email: 'alice@example.com' },
        });

        const result = await controller.login(
            { account: 'alice@example.com', password: 'P@ssw0rd!' } as never,
            response
        );

        expect(identityKernel.authenticatePassword).toHaveBeenCalledOnce();
        expect(result).toMatchObject({
            accessToken: 'at-login',
            user: { email: 'alice@example.com' },
        });
    });

    it('rotates the session and sets the new refresh cookie', async () => {
        const response: any = { setCookie: vi.fn() };
        identityKernel.rotateRefreshSession.mockResolvedValue({
            accessToken: 'at-new',
            refreshToken: 'rt-new',
        });

        const result = await controller.refreshToken('rt-old', response);

        expect(identityKernel.rotateRefreshSession).toHaveBeenCalledWith('rt-old');
        expect(response.setCookie).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ accessToken: 'at-new' });
    });

    it('clears the refresh cookie on logout', async () => {
        const response: any = { clearCookie: vi.fn() };

        await expect(controller.logout(response)).resolves.toBe('ok');
        expect(response.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE.NAME, {
            path: REFRESH_TOKEN_COOKIE.PATH,
        });
    });
});
