import { alovaInstance } from '../client';
import type { Reagent, CreateReagentInput, UpdateReagentInput } from '@/schemas/reagent.schema';

// Reagents
export const getReagent = (id: string) =>
    alovaInstance.Get<Reagent>('/reagent/one', { params: { id } });

export const listReagents = (params: { orgId?: string; nodeId?: string }) =>
    alovaInstance.Get<Reagent[]>('/reagent/list', { params });

export const updateReagent = (data: UpdateReagentInput) =>
    alovaInstance.Put<Reagent>('/reagent/update', data);

export const createReagent = (data: CreateReagentInput) =>
    alovaInstance.Post<Reagent>('/reagent/add', data);

export const deleteReagent = (id: string | string[]) =>
    alovaInstance.Delete<void>('/reagent/del', { id });
