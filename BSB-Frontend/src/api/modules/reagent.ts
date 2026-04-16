import { alovaInstance } from '../client';
import { Reagent } from '@/schemas/box.schema';

// Reagents
export const getReagent = (id: string) =>
    alovaInstance.Get<Reagent>('/reagent/one', { params: { id } });

export const listReagents = (boxId: string) =>
    alovaInstance.Get<Reagent[]>('/reagent/list', { params: { boxId } });

export const updateReagent = (data: {
    id: string;
    position?: string;
    name?: string;
    description?: string;
}) => alovaInstance.Put<Reagent>('/reagent/update', data);

export const createReagent = (data: {
    boxId: string;
    position: string;
    name: string;
    description?: string;
    reagentTypeId?: string;
}) => alovaInstance.Post<Reagent>('/reagent/add', data);
