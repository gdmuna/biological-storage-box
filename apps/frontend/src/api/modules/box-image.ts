import { alovaInstance } from '../client';
import type { BoxImage } from '@/schemas/box.schema';

export const createBoxImage = (data: { boxId: string; imageUrl: string }) =>
    alovaInstance.Post<BoxImage>('/box/image/add', data);

export const listBoxImages = (boxId: string) =>
    alovaInstance.Get<BoxImage[]>('/box/image/list', { params: { boxId }, cacheFor: 0 });

export const compareBoxImage = (data: { boxId: string; imageUrl: string }) =>
    alovaInstance.Post('/box/image/compare', data);

export const deleteBoxImage = (id: string) => alovaInstance.Delete<void>('/box/image/del', { id });
