import { ClientException, AuthException, RegisterException } from '@/common/exceptions/index.js';

export const ShareExceptionCode = {
    NOT_FOUND: 'SHARE_NOT_FOUND',
    NOT_OWNER: 'SHARE_NOT_OWNER',
    ALREADY_EXISTS: 'SHARE_ALREADY_EXISTS',
} as const;

@RegisterException({
    code: ShareExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '共享记录不存在',
    description: '指定的共享 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class ShareNotFoundException extends ClientException {}

@RegisterException({
    code: ShareExceptionCode.NOT_OWNER,
    statusCode: 403,
    message: '只有资源归属组织才能执行此操作',
    description: '当前用户所在组织不是该资源的归属组织',
    retryable: false,
    logLevel: 'info',
})
export class ShareNotOwnerException extends AuthException {}

@RegisterException({
    code: ShareExceptionCode.ALREADY_EXISTS,
    statusCode: 409,
    message: '共享关系已存在',
    description: '该资源已向目标组织共享，请勿重复操作',
    retryable: false,
    logLevel: 'info',
})
export class ShareAlreadyExistsException extends ClientException {}

export default { ShareNotFoundException, ShareNotOwnerException, ShareAlreadyExistsException };
