import { z } from 'zod/v4';

const LogUserRefSchema = z.object({
    id: z.string(),
    username: z.string(),
    nickname: z.string().nullable().optional(),
});

export const BoxLogItemSchema = z.object({
    id: z.string(),
    nodeId: z.string(),
    userId: z.string(),
    operationType: z.string(),
    detail: z.string().nullable().optional(),
    createdAt: z.string(),
    user: LogUserRefSchema,
});

export type BoxLogItem = z.infer<typeof BoxLogItemSchema>;

export const BoxLogPaginatedSchema = z.object({
    items: z.array(BoxLogItemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
});

export type BoxLogPaginated = z.infer<typeof BoxLogPaginatedSchema>;

export const ReagentLogItemSchema = z.object({
    id: z.string(),
    reagentId: z.string(),
    userId: z.string(),
    operationType: z.enum(['PLACED', 'TAKEN', 'MOVED', 'UPDATED', 'DELETED']),
    detail: z.string().nullable().optional(),
    createdAt: z.string(),
    user: LogUserRefSchema,
});

export type ReagentLogItem = z.infer<typeof ReagentLogItemSchema>;

export const ReagentLogPaginatedSchema = z.object({
    items: z.array(ReagentLogItemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
});

export type ReagentLogPaginated = z.infer<typeof ReagentLogPaginatedSchema>;

/** @deprecated use BoxLogItem instead */
export const FeedbackLogSchema = BoxLogItemSchema;
/** @deprecated use BoxLogItem instead */
export type FeedbackLog = BoxLogItem;

export const CreateFeedbackSchema = z.object({
    content: z.string().min(1).max(2000),
});

export type CreateFeedbackPayload = z.infer<typeof CreateFeedbackSchema>;
