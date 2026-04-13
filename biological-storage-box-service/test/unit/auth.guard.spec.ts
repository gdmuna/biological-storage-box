import { AuthGuard } from '@/modules/auth/auth.guard.js';

describe('AuthGuard', () => {
    const reflector = {
        getAllAndOverride: jest.fn(),
    };

    const tokenService = {
        verifyToken: jest.fn(),
    };

    const guard = new AuthGuard(reflector as any, tokenService as any);

    const createContext = (request: any) =>
        ({
            switchToHttp: () => ({
                getRequest: () => request,
            }),
            getHandler: () => 'handler',
            getClass: () => 'class',
        }) as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow public route without token', () => {
        reflector.getAllAndOverride.mockReturnValue('public');

        const request: any = { headers: {} };
        const result = guard.canActivate(createContext(request));

        expect(result).toBe(true);
        expect(request.jwtClaim).toBeUndefined();
    });

    it('should attach user on private route with valid token', () => {
        reflector.getAllAndOverride.mockReturnValue('required');
        tokenService.verifyToken.mockReturnValue({
            sub: 'u_1',
            tokenType: 'access',
            iat: 1,
            exp: 2,
            jti: 'jti_1',
        });

        const request: any = { headers: { authorization: 'Bearer access-token' } };
        const result = guard.canActivate(createContext(request));

        expect(result).toBe(true);
        expect(tokenService.verifyToken).toHaveBeenCalledWith('access-token', 'access');
        expect(request.jwtClaim?.sub).toBe('u_1');
    });

    it('should throw on private route with invalid token', () => {
        reflector.getAllAndOverride.mockReturnValue('required');
        tokenService.verifyToken.mockReturnValue(null);

        const request: any = { headers: { authorization: 'Bearer bad-token' } };

        expect(() => guard.canActivate(createContext(request))).toThrow('Token 无效或已过期');
    });
});
