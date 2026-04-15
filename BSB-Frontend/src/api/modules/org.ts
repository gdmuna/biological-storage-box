import { alovaInstance } from '../client';
import type { Org, CreateOrgForm } from '@/schemas/org.schema';

export const createOrg = (data: CreateOrgForm) => alovaInstance.Post<Org>('/org/create', data);

export const deleteOrg = (orgId: string) => alovaInstance.Delete<void>('/org/del', { orgId });

export const getOrg = (orgId: string) => alovaInstance.Get<Org>('/org/one', { params: { orgId } });

export const listOrgs = () => alovaInstance.Get<Org[]>('/org/list', { cacheFor: 0 });

export const searchOrgs = (params: { keyword: string; limit?: number }) =>
    alovaInstance.Get<Org[]>('/org/search', { params });

export const updateOrg = (data: { orgId: string; name?: string; description?: string }) =>
    alovaInstance.Put<Org>('/org/update', data);

export const updateOrgFull = (data: {
    orgId: string;
    name?: string;
    description?: string;
    isPublic?: boolean;
    avatarUrl?: string;
}) => alovaInstance.Put<Org>('/org/update', data);

export const exploreOrgs = (params?: { keyword?: string; limit?: number; offset?: number }) =>
    alovaInstance.Get<
        {
            id: string;
            name: string;
            description: string;
            avatarUrl: string | null;
            _count: { members: number };
        }[]
    >('/org/explore', { params });

export const searchOrgMembers = (params: { orgId: string; keyword: string }) =>
    alovaInstance.Get<
        { user: { id: string; username: string; nickname: string; email: string }; role: string }[]
    >('/org/members/search', { params });
