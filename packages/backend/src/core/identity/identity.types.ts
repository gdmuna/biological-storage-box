import type { User } from '@root/prisma/generated/client.js';

export type TokenType = 'access' | 'refresh';

export interface JwtClaim {
    sub: string;
    iat: number;
    exp: number;
    jti: string;
    tokenType: TokenType;
}

export interface AccessTokenClaim extends JwtClaim {
    tokenType: 'access';
    user: Omit<User, 'passwordHash'>;
}

export interface RefreshTokenClaim extends JwtClaim {
    tokenType: 'refresh';
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface PasswordRegistrationCommand {
    username: string;
    email: string;
    password: string;
}

export interface PasswordLoginCommand {
    account: string;
    password: string;
}

export interface IssueSessionCommand {
    userId: string;
    username: string;
}

export interface IdentitySession extends TokenPair {
    user: Pick<User, 'id' | 'username' | 'email'>;
}
