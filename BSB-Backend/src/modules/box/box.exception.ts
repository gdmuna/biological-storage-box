import { ClientException, RegisterException } from '@/common/exceptions/index.js';

export const BoxExceptionCode = {
    NOT_FOUND: 'BOX_NOT_FOUND',
} as const;

@RegisterException({
    code: BoxExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '储存盒不存在',
    description: '指定的储存盒 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class BoxNotFoundException extends ClientException {}

export default { BoxNotFoundException };
