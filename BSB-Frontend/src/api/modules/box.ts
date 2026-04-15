import { alovaInstance } from '../client';
import type { Box, BoxAlias, Reagent } from '@/schemas/box.schema';

export const createBox = (data: {
    orgId: string;
    rootId?: string;
    nodeId?: string;
    name: string;
    description?: string;
    rows?: number;
    cols?: number;
}) => alovaInstance.Post<Box>('/box/add', data);

export const deleteBox = (id: string) => alovaInstance.Delete<void>('/box/del', { id });

export const getBox = (id: string) => alovaInstance.Get<Box>('/box/one', { params: { id } });

export const listBoxes = (orgId: string) =>
    alovaInstance.Get<Box[]>('/box/list', { params: { orgId } });

export const listBoxesGroupedByRoot = (orgId: string) =>
    alovaInstance.Get<{ rootId: string | null; rootName: string | null; boxes: Box[] }[]>(
        '/box/root/list',
        { params: { orgId } }
    );

export const searchBoxes = (params: { orgId: string; keyword: string; limit?: number }) =>
    alovaInstance.Get<Box[]>('/box/search', { params });

export const updateBox = (data: {
    id: string;
    rootId?: string | null;
    name?: string;
    description?: string;
}) => alovaInstance.Put<Box>('/box/update', data);

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

// Box Aliases
export const createBoxAlias = (data: { boxId: string; alias: string }) =>
    alovaInstance.Post<BoxAlias>('/box/alias/add', data);

export const deleteBoxAlias = (id: string) => alovaInstance.Delete<void>('/box/alias/del', { id });

export const listBoxAliases = (boxId: string) =>
    alovaInstance.Get<BoxAlias[]>('/box/alias/list', { params: { boxId } });

export const updateBoxAlias = (data: { id: string; alias: string }) =>
    alovaInstance.Put<BoxAlias>('/box/alias/update', data);
