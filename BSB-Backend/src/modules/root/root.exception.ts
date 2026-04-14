import { ClientException, RegisterException } from '@/common/exceptions/index.js';

export const RootExceptionCode = {
    NOT_FOUND: 'ROOT_NOT_FOUND',
} as const;

@RegisterException({
    code: RootExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '房间/位置不存在',
    description: '指定的房间/位置 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class RootNotFoundException extends ClientException {}

export default { RootNotFoundException };
