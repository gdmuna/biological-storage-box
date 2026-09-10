import { ClientException, RegisterException } from '@/common/exceptions/index.js';

export const ReagentExceptionCode = {
    NOT_FOUND: 'REAGENT_NOT_FOUND',
} as const;

@RegisterException({
    code: ReagentExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '试剂不存在',
    description: '指定的试剂 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class ReagentNotFoundException extends ClientException {}

export default { ReagentNotFoundException };
