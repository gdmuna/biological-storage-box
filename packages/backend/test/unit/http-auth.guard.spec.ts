import { AuthGuard } from '@/platform/http/guards/auth.guard.js';

describe('AuthGuard', () => {
    const reflector = {
        getAllAndOverride: vi.fn(),
    };
    const identityKernel = {
        verifyAccessToken: vi.fn(),
    };
    const guard = new AuthGuard(reflector as never, identityKernel as never);

    const createContext = (request: any) =>
        ({
            switchToHttp: () => ({ getRequest: () => request }),
            getHandler: () => 'handler',
            getClass: () => 'class',
        }) as never;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows a public route without a token', () => {
        reflector.getAllAndOverride.mockReturnValue('public');
        const request: any = { headers: {} };

        expect(guard.canActivate(createContext(request))).toBe(true);
        expect(request.jwtClaim).toBeUndefined();
    });

    it('attaches a verified claim on a required route', () => {
        reflector.getAllAndOverride.mockReturnValue('required');
        identityKernel.verifyAccessToken.mockReturnValue({
            sub: 'u_1',
            tokenType: 'access',
            iat: 1,
            exp: 2,
            jti: 'jti_1',
        });
        const request: any = { headers: { authorization: 'Bearer access-token' } };

        expect(guard.canActivate(createContext(request))).toBe(true);
        expect(identityKernel.verifyAccessToken).toHaveBeenCalledWith('access-token');
        expect(request.jwtClaim?.sub).toBe('u_1');
    });

    it('rejects an invalid token on a required route', () => {
        reflector.getAllAndOverride.mockReturnValue('required');
        identityKernel.verifyAccessToken.mockReturnValue(null);

        expect(() =>
            guard.canActivate(createContext({ headers: { authorization: 'Bearer bad-token' } }))
        ).toThrow('Token 无效或已过期');
    });
});
