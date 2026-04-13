import { AccessTokenClaim } from '@/modules/auth/services/index.ts';

declare global {
    namespace Express {
        interface Request {
            id?: string;
            version?: string;
            jwtClaim?: AccessTokenClaim;
        }
    }
}

export {};
