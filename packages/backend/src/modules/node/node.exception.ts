import { ClientException, RegisterException } from '@/platform/errors/index.js';

export const NodeExceptionCode = {
    NOT_FOUND: 'NODE_NOT_FOUND',
    CIRCULAR_REFERENCE: 'NODE_CIRCULAR_REFERENCE',
} as const;

@RegisterException({
    code: NodeExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '节点不存在',
    description: '指定的 Node ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class NodeNotFoundException extends ClientException {}

@RegisterException({
    code: NodeExceptionCode.CIRCULAR_REFERENCE,
    statusCode: 400,
    message: '不允许循环引用',
    description: '将节点移动到自身或后代节点下会形成循环引用',
    retryable: false,
    logLevel: 'warn',
})
export class NodeCircularReferenceException extends ClientException {}

export default { NodeNotFoundException, NodeCircularReferenceException };
