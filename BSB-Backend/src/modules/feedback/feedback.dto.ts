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
