import { z } from 'zod/v4';

export const FeedbackLogSchema = z.object({
    id: z.string(),
    action: z.string(),
    content: z.string().nullable().optional(),
    createdAt: z.string(),
});

export type FeedbackLog = z.infer<typeof FeedbackLogSchema>;

export const CreateFeedbackSchema = z.object({
    content: z.string().min(1).max(2000),
});

export type CreateFeedbackPayload = z.infer<typeof CreateFeedbackSchema>;
