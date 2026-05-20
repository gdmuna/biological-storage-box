import { alovaInstance } from '../client';

export interface ErrorCatalogItem {
    code: string;
    message?: string;
    statusCode?: number;
    [key: string]: unknown;
}

export const listErrors = () => alovaInstance.Get<ErrorCatalogItem[]>('/errors');

export const getErrorByCode = (exceptionCode: string) =>
    alovaInstance.Get<ErrorCatalogItem>(`/errors/${exceptionCode}`);
