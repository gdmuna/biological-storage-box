import { DuplicateUserException, InvalidTokenException } from '@/modules/auth/auth.exception.js';

import { AuthService } from '@/modules/auth/services/auth.service.js';
import { TokenService } from '@/modules/auth/services/token.service.js';
import { LoginDto } from '@/modules/auth/auth.dto.js';

import bcrypt from 'bcryptjs';

describe('AuthService', () => {
    const passwordHash = bcrypt.hashSync('P@ssw0rd!', 10);

    const mockDatabaseService: any = {
        user: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    const mockTokenService: jest.Mocked<Pick<TokenService, 'issueTokenPair' | 'verifyToken'>> = {
        issueTokenPair: jest.fn(),
        verifyToken: jest.fn(),
    };

    const mockConfigService: any = {
        get: jest.fn().mockReturnValue(10),
    };

    let service: AuthService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AuthService(
            mockDatabaseService,
            mockTokenService as unknown as TokenService,
            mockConfigService
        );
    });

    it('login should return access token and refresh token', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({
            id: 'u_1',
            username: 'john',
            email: 'john@example.com',
            passwordHash,
        });
        mockTokenService.issueTokenPair.mockReturnValue({
            accessToken: 'at_1',
            refreshToken: 'rt_1',
        });

        const payload: LoginDto = {
            account: 'john@example.com',
            password: 'P@ssw0rd!',
        };

        const result = await service.login(payload);

        expect(result.accessToken).toBe('at_1');
        expect(result.refreshToken).toBe('rt_1');
        expect(result.user.username).toBe('john');
        expect(mockTokenService.issueTokenPair).toHaveBeenCalledWith({
            userId: 'u_1',
            username: 'john',
        });
    });

    it('register should create user and return token pair', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValueOnce(null);
        mockDatabaseService.user.create.mockResolvedValue({
            id: 'u_register',
            username: 'new_user',
            email: 'new@example.com',
            passwordHash,
        });
        mockTokenService.issueTokenPair.mockReturnValue({
            accessToken: 'at_register',
            refreshToken: 'rt_register',
        });

        const result = await service.register({
            username: 'new_user',
            email: 'new@example.com',
            password: 'P@ssw0rd!',
        });

        expect(result.accessToken).toBe('at_register');
        expect(result.refreshToken).toBe('rt_register');
        expect(result.user.email).toBe('new@example.com');
        expect(mockDatabaseService.user.create).toHaveBeenCalledTimes(1);
    });

    it('register should throw conflict on duplicate username/email', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({
            id: 'u_exists',
            username: 'new_user',
            email: 'new@example.com',
            passwordHash,
        });

        await expect(
            service.register({
                username: 'new_user',
                email: 'new@example.com',
                password: 'P@ssw0rd!',
            })
        ).rejects.toBeInstanceOf(DuplicateUserException);
    });

    it('rotateRefreshToken should rotate token once', async () => {
        mockTokenService.verifyToken.mockReturnValue({ sub: 'u_4' } as any);
        mockDatabaseService.user.findUnique.mockResolvedValue({
            id: 'u_4',
            username: 'neo',
            email: 'neo@example.com',
            passwordHash,
        });
        mockTokenService.issueTokenPair.mockReturnValue({
            accessToken: 'at_new',
            refreshToken: 'rt_new',
        });

        const rotated = await service.rotateRefreshToken('rt_old');

        expect(rotated.accessToken).toBe('at_new');
        expect(rotated.refreshToken).toBe('rt_new');
        expect(mockTokenService.verifyToken).toHaveBeenCalledWith('rt_old', 'refresh');
        expect(mockTokenService.issueTokenPair).toHaveBeenCalledWith({
            userId: 'u_4',
            username: 'neo',
        });
    });

    it('rotateRefreshToken should reject invalid refresh token', async () => {
        mockTokenService.verifyToken.mockReturnValue(null);

        await expect(service.rotateRefreshToken('invalid_refresh_token')).rejects.toBeInstanceOf(
            InvalidTokenException
        );

        expect(mockDatabaseService.user.findUnique).not.toHaveBeenCalled();
    });
});
