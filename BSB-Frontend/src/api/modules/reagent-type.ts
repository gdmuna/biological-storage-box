import { alovaInstance } from '../client';

export interface ReagentTypeItem {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    colorHex: string | null;
    unit: string | null;
    createdAt: string;
}

export const createReagentType = (data: {
    orgId: string;
    name: string;
    description?: string;
    colorHex?: string;
    unit?: string;
}) => alovaInstance.Post<ReagentTypeItem>('/reagent-type/add', data);

export const listReagentTypes = (params: { orgId?: string; nodeId?: string }) =>
    alovaInstance.Get<ReagentTypeItem[]>('/reagent-type/list', { params });

export const updateReagentType = (data: {
    id: string;
    name?: string;
    description?: string;
    colorHex?: string;
    unit?: string;
}) => alovaInstance.Put<ReagentTypeItem>('/reagent-type/update', data);

export const deleteReagentType = (id: string | string[]) =>
    alovaInstance.Delete<void>('/reagent-type/del', { id });
