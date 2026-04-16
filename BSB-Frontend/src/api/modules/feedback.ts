import { alovaInstance } from '../client';
import type { FeedbackLog, CreateFeedbackPayload } from '@/schemas/feedback.schema';

export const listBoxLogs = (params: { boxId: string; limit?: number; offset?: number }) =>
    alovaInstance.Get<FeedbackLog[]>('/box/log/list', { params });

export const listReagentLogs = (params: { reagentId: string; limit?: number; offset?: number }) =>
    alovaInstance.Get<FeedbackLog[]>('/box/log/reagent/list', { params });

export const createFeedback = (data: CreateFeedbackPayload) =>
    alovaInstance.Post<void>('/feedback/add', data);
