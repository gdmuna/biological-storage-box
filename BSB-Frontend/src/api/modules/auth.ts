import { alovaInstance } from '../client';
import type { UserInfo, LoginForm, RegisterForm } from '@/schemas/user.schema';

export const login = (data: LoginForm) => alovaInstance.Post<UserInfo>('/auth/login', data);

export const register = (data: RegisterForm) =>
    alovaInstance.Post<UserInfo>('/auth/register', data);

export const logout = () => alovaInstance.Get<void>('/auth/clear-cookie');

export const getMyInfo = () => alovaInstance.Get<UserInfo>('/user/info');
