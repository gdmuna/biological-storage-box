import type { Mocked } from 'vitest';

import {
    DuplicateUserException,
    InvalidTokenException,
} from '@/core/identity/identity.exception.js';
import { IdentityKernel } from '@/core/identity/identity.kernel.js';
import { IdentityRepository } from '@/core/identity/internal/identity.repository.js';
import { TokenService } from '@/core/identity/internal/token.service.js';
import type { PasswordLoginCommand } from '@/core/identity/index.js';

import bcrypt from 'bcryptjs';

describe('IdentityKernel', () => {
    const passwordHash = bcrypt.hashSync('P@ssw0rd!', 10);

    const identityRepository: Mocked<
        Pick<
            IdentityRepository,
            'findDuplicate' | 'findByAccount' | 'createPasswordAccount' | 'findById'
        >
    > = {
        findDuplicate: vi.fn(),
        findByAccount: vi.fn(),
        createPasswordAccount: vi.fn(),
        findById: vi.fn(),
    };

    const tokenService = {
        issueTokenPair: vi.fn(),
        verifyToken: vi.fn(),
    } as unknown as Mocked<Pick<TokenService, 'issueTokenPair' | 'verifyToken'>>;

    const configService = {
        get: vi.fn().mockReturnValue(10),
    };

    let kernel: IdentityKernel;

    beforeEach(() => {
        vi.clearAllMocks();
        kernel = new IdentityKernel(
            identityRepository as unknown as IdentityRepository,
            tokenService as unknown as TokenService,
            configService as never
        );
    });

    it('authenticates a password and issues a token pair', async () => {
        identityRepository.findByAccount.mockResolvedValue({
            id: 'u_1',
            username: 'john',
            email: 'john@example.com',
            passwordHash,
        } as never);
        tokenService.issueTokenPair.mockReturnValue({
            accessToken: 'at_1',
            refreshToken: 'rt_1',
        });

        const payload: PasswordLoginCommand = {
            account: 'john@example.com',
            password: 'P@ssw0rd!',
        };
        const result = await kernel.authenticatePassword(payload);

        expect(result).toMatchObject({
            accessToken: 'at_1',
            refreshToken: 'rt_1',
            user: { username: 'john' },
        });
        expect(tokenService.issueTokenPair).toHaveBeenCalledWith({
            userId: 'u_1',
            username: 'john',
        });
    });

    it('registers a local account and returns a token pair', async () => {
        identityRepository.findDuplicate.mockResolvedValue(null);
        identityRepository.createPasswordAccount.mockResolvedValue({
            id: 'u_register',
            username: 'new_user',
            email: 'new@example.com',
            passwordHash,
        } as never);
        tokenService.issueTokenPair.mockReturnValue({
            accessToken: 'at_register',
            refreshToken: 'rt_register',
        });

        const result = await kernel.registerPassword({
            username: 'new_user',
            email: 'new@example.com',
            password: 'P@ssw0rd!',
        });

        expect(result).toMatchObject({
            accessToken: 'at_register',
            refreshToken: 'rt_register',
            user: { email: 'new@example.com' },
        });
        expect(identityRepository.createPasswordAccount).toHaveBeenCalledTimes(1);
    });

    it('rejects duplicate local accounts', async () => {
        identityRepository.findDuplicate.mockResolvedValue({ id: 'u_exists' } as never);

        await expect(
            kernel.registerPassword({
                username: 'new_user',
                email: 'new@example.com',
                password: 'P@ssw0rd!',
            })
        ).rejects.toBeInstanceOf(DuplicateUserException);
    });

    it('rotates a valid refresh session', async () => {
        tokenService.verifyToken.mockReturnValue({ sub: 'u_4' } as never);
        identityRepository.findById.mockResolvedValue({
            id: 'u_4',
            username: 'neo',
            email: 'neo@example.com',
            passwordHash,
        } as never);
        tokenService.issueTokenPair.mockReturnValue({
            accessToken: 'at_new',
            refreshToken: 'rt_new',
        });

        await expect(kernel.rotateRefreshSession('rt_old')).resolves.toEqual({
            accessToken: 'at_new',
            refreshToken: 'rt_new',
        });
        expect(tokenService.verifyToken).toHaveBeenCalledWith('rt_old', 'refresh');
    });

    it('rejects an invalid refresh session', async () => {
        tokenService.verifyToken.mockReturnValue(null);

        await expect(kernel.rotateRefreshSession('invalid_refresh_token')).rejects.toBeInstanceOf(
            InvalidTokenException
        );
        expect(identityRepository.findById).not.toHaveBeenCalled();
    });
});
