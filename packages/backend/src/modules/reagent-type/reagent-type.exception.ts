import { ClientException, AuthException, RegisterException } from '@/platform/errors/index.js';

export const ReagentTypeExceptionCode = {
    NOT_FOUND: 'REAGENT_TYPE_NOT_FOUND',
    NOT_ADMIN: 'REAGENT_TYPE_NOT_ADMIN',
} as const;

@RegisterException({
    code: ReagentTypeExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '试剂类型不存在',
    description: '指定的试剂类型 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class ReagentTypeNotFoundException extends ClientException {}

@RegisterException({
    code: ReagentTypeExceptionCode.NOT_ADMIN,
    statusCode: 403,
    message: '需要管理员权限',
    description: '当前用户不是组织管理员，无权操作试剂类型',
    retryable: false,
    logLevel: 'info',
})
export class ReagentTypeNotAdminException extends AuthException {}

export default { ReagentTypeNotFoundException, ReagentTypeNotAdminException };
