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

// ── 响应 VO ───────────────────────────────────────────────

const DatabaseComponentVoSchema = z.object({
    status: z.enum(['ok', 'down']).meta({ title: '数据库状态' }),
    responseTimeMs: z.number().meta({ title: '响应时间（ms）' }),
    error: z.string().optional().meta({ title: '错误信息（down 时存在）' }),
});

const HealthCheckVoSchema = z
    .object({
        status: z.enum(['ok']).meta({ title: '应用状态' }),
        uptime: z.number().meta({ title: '运行时长（秒）' }),
        version: z.string().meta({ title: '应用版本' }),
        gitCommit: z.string().optional().meta({ title: 'Git Commit' }),
        components: z
            .object({
                database: DatabaseComponentVoSchema,
            })
            .meta({ title: '组件健康状态' }),
    })
    .meta({ description: '应用健康检查结果' });

export class HealthCheckVo extends createZodDto(HealthCheckVoSchema) {}
