import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

// ── BoxLog ─────────────────────────────────────────

const BoxLogListDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
        limit: z.coerce.number().int().min(1).max(200).default(50).meta({ title: '数量上限' }),
        offset: z.coerce.number().int().min(0).default(0).meta({ title: '偏移量' }),
    })
    .meta({ description: '储存盒操作日志查询参数' });

export class BoxLogListDto extends createZodDto(BoxLogListDtoSchema) {}

const BoxLogReagentListDtoSchema = z
    .object({
        reagentId: z.string().min(1).meta({ title: 'Reagent ID' }),
        limit: z.coerce.number().int().min(1).max(200).default(50).meta({ title: '数量上限' }),
        offset: z.coerce.number().int().min(0).default(0).meta({ title: '偏移量' }),
    })
    .meta({ description: '试剂操作日志查询参数' });

export class BoxLogReagentListDto extends createZodDto(BoxLogReagentListDtoSchema) {}

// ── Feedback ───────────────────────────────────────

const CreateFeedbackDtoSchema = z
    .object({
        content: z.string().min(1).max(2000).meta({ title: '反馈内容' }),
    })
    .meta({ description: '提交反馈请求体' });

export class CreateFeedbackDto extends createZodDto(CreateFeedbackDtoSchema) {}

// ── 响应 VO ───────────────────────────────────────────────

const LogUserRefSchema = z.object({
    id: z.string(),
    username: z.string(),
    nickname: z.string().nullable().optional(),
});

const BoxLogItemVoSchema = z
    .object({
        id: z.string().meta({ title: '日志 ID' }),
        nodeId: z.string().meta({ title: 'Box ID' }),
        userId: z.string().meta({ title: '操作用户 ID' }),
        operationType: z.string().meta({ title: '操作类型' }),
        detail: z.string().nullable().optional().meta({ title: '详情' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        user: LogUserRefSchema.meta({ title: '操作用户' }),
    })
    .meta({ description: '储存盒操作日志项' });

export class BoxLogItemVo extends createZodDto(BoxLogItemVoSchema) {}

const BoxLogPaginatedVoSchema = z
    .object({
        items: z.array(BoxLogItemVoSchema).meta({ title: '日志列表' }),
        total: z.number().int().meta({ title: '总数' }),
        limit: z.number().int().meta({ title: '每页数量' }),
        offset: z.number().int().meta({ title: '偏移量' }),
    })
    .meta({ description: '储存盒操作日志分页结果' });

export class BoxLogPaginatedVo extends createZodDto(BoxLogPaginatedVoSchema) {}

const ReagentLogItemVoSchema = z
    .object({
        id: z.string().meta({ title: '日志 ID' }),
        reagentId: z.string().meta({ title: 'Reagent ID' }),
        userId: z.string().meta({ title: '操作用户 ID' }),
        operationType: z
            .enum(['PLACED', 'TAKEN', 'MOVED', 'UPDATED', 'DELETED'])
            .meta({ title: '操作类型' }),
        detail: z.string().nullable().optional().meta({ title: '详情' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        user: LogUserRefSchema.meta({ title: '操作用户' }),
    })
    .meta({ description: '试剂操作日志项' });

export class ReagentLogItemVo extends createZodDto(ReagentLogItemVoSchema) {}

const ReagentLogPaginatedVoSchema = z
    .object({
        items: z.array(ReagentLogItemVoSchema).meta({ title: '日志列表' }),
        total: z.number().int().meta({ title: '总数' }),
        limit: z.number().int().meta({ title: '每页数量' }),
        offset: z.number().int().meta({ title: '偏移量' }),
    })
    .meta({ description: '试剂操作日志分页结果' });

export class ReagentLogPaginatedVo extends createZodDto(ReagentLogPaginatedVoSchema) {}

const FeedbackVoSchema = z
    .object({
        id: z.string().meta({ title: '反馈 ID' }),
        userId: z.string().meta({ title: '用户 ID' }),
        content: z.string().meta({ title: '反馈内容' }),
        createdAt: z.string().meta({ title: '创建时间' }),
    })
    .meta({ description: '反馈记录' });

export class FeedbackVo extends createZodDto(FeedbackVoSchema) {}
