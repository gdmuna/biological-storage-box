import { alovaInstance } from '../client';
import type { UserInfo, LoginForm, RegisterForm } from '@/schemas/user.schema';

/** Shape returned by POST /auth/login and POST /auth/register */
export interface AuthResponse {
    accessToken: string;
    user: { id: string; username: string; email: string };
}

export const login = (data: LoginForm) => alovaInstance.Post<AuthResponse>('/auth/login', data);

export const register = (data: RegisterForm) =>
    alovaInstance.Post<AuthResponse>('/auth/register', data);

export const logout = () => alovaInstance.Get<void>('/auth/clear-cookie');

export const getMyInfo = () => alovaInstance.Get<UserInfo>('/user/info');
