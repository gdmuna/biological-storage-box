import { alovaInstance } from '../client';
import { Reagent } from '@/schemas/box.schema';

// Reagents
export const getReagent = (id: string) =>
    alovaInstance.Get<Reagent>('/reagent/one', { params: { id } });

export const listReagents = (params: { orgId?: string; nodeId?: string }) =>
    alovaInstance.Get<Reagent[]>('/reagent/list', { params });

export const updateReagent = (data: {
    id: string;
    position?: string;
    name?: string;
    description?: string;
    reagentTypeId?: string | null;
}) => alovaInstance.Put<Reagent>('/reagent/update', data);

export const createReagent = (data: {
    nodeId: string;
    position: string;
    name: string;
    description?: string;
    reagentTypeId?: string | null;
}) => alovaInstance.Post<Reagent>('/reagent/add', data);

export const deleteReagent = (id: string | string[]) =>
    alovaInstance.Delete<void>('/reagent/del', { id });
