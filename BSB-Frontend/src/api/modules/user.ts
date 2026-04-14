import { alovaInstance } from '../client';
import type { UserInfo } from '@/schemas/user.schema';

export const updateUserInfo = (data: { nickname?: string; realname?: string }) =>
    alovaInstance.Put<UserInfo>('/user/update/info', data);

export const updatePassword = (data: { oldPassword: string; newPassword: string }) =>
    alovaInstance.Put<void>('/user/update/password', data);

export const searchUsers = (params: { keyword: string; limit?: number }) =>
    alovaInstance.Get<UserInfo[]>('/user/search', { params });
