import { alovaInstance } from '../client';
import type { Root } from '@/schemas/root.schema';

export const createRoot = (data: { orgId: string; name: string; description?: string }) =>
    alovaInstance.Post<Root>('/root/add', data);

export const deleteRoot = (id: string) => alovaInstance.Delete<void>('/root/del', { data: { id } });

export const getRoot = (id: string) => alovaInstance.Get<Root>('/root/one', { params: { id } });

export const listRoots = (orgId: string) =>
    alovaInstance.Get<Root[]>('/root/list', { params: { orgId } });

export const updateRoot = (data: { id: string; name?: string; description?: string }) =>
    alovaInstance.Put<Root>('/root/update', data);
