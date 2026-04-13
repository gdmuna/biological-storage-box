import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const ALLOWED_LOG_LEVELS = ['silent', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

export const ChangeLoggerLevelDtoSchema = z.object({
    level: z.enum(ALLOWED_LOG_LEVELS).meta({
        title: '日志级别',
        description: `必须是 ${ALLOWED_LOG_LEVELS.join('/')} 之一`,
        example: 'debug',
    }),
});

export class ChangeLoggerLevelDto extends createZodDto(ChangeLoggerLevelDtoSchema) {}
