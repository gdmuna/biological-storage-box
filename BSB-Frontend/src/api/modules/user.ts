import { alovaInstance } from '../client';
import type { UserInfo } from '@/schemas/user.schema';

export const updateUserInfo = (data: { nickname?: string; realname?: string }) =>
    alovaInstance.Put<UserInfo>('/user/update/info', data);

export const updatePassword = (data: { oldPassword: string; newPassword: string }) =>
    alovaInstance.Put<void>('/user/update/password', data);

export const searchUsers = (params: { keyword: string; limit?: number }) =>
    alovaInstance.Get<UserInfo[]>('/user/search', { params });

export interface EmailLoginResponse {
    accessToken: string;
    user: { id: string; username: string; email: string };
}

export const sendEmailCode = (email: string) =>
    alovaInstance.Get<void>('/user/email/code', { params: { email } });

export const emailLogin = (data: { email: string; code: string }) =>
    alovaInstance.Post<EmailLoginResponse>('/user/email/login', data);

export const updateEmail = (data: { email: string; code: string }) =>
    alovaInstance.Put<UserInfo>('/user/update/email', data);

export const emailUpdatePassword = (data: { email: string; code: string; newPassword: string }) =>
    alovaInstance.Put<void>('/user/email/update/password', data);
