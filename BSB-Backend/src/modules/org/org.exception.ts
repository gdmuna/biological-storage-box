import { ClientException, AuthException, RegisterException } from '@/common/exceptions/index.js';

export const OrgExceptionCode = {
    NOT_FOUND: 'ORG_NOT_FOUND',
    NOT_OWNER: 'ORG_NOT_OWNER',
    NOT_MEMBER: 'ORG_NOT_MEMBER',
    NOT_ADMIN: 'ORG_NOT_ADMIN',
    ALREADY_MEMBER: 'ORG_ALREADY_MEMBER',
    ALREADY_APPLIED: 'ORG_ALREADY_APPLIED',
    OWNER_CANNOT_QUIT: 'ORG_OWNER_CANNOT_QUIT',
    CANNOT_PROMOTE_OWNER: 'ORG_CANNOT_PROMOTE_OWNER',
    APPLICATION_NOT_FOUND: 'ORG_APPLICATION_NOT_FOUND',
} as const;

@RegisterException({
    code: OrgExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '组织不存在',
    description: '指定的组织 ID 未找到匹配的组织',
    retryable: false,
    logLevel: 'info',
})
export class OrgNotFoundException extends ClientException {}

@RegisterException({
    code: OrgExceptionCode.NOT_OWNER,
    statusCode: 403,
    message: '只有组织所有者才能执行此操作',
    description: '当前用户不是组织的所有者，无权执行此操作',
    retryable: false,
    logLevel: 'info',
})
export class OrgNotOwnerException extends AuthException {}

@RegisterException({
    code: OrgExceptionCode.NOT_MEMBER,
    statusCode: 403,
    message: '你不是该组织的成员',
    description: '当前用户不是指定组织的活跃成员',
    retryable: false,
    logLevel: 'info',
})
export class OrgNotMemberException extends AuthException {}

@RegisterException({
    code: OrgExceptionCode.NOT_ADMIN,
    statusCode: 403,
    message: '需要管理员或所有者权限',
    description: '当前用户不是组织管理员或所有者，权限不足',
    retryable: false,
    logLevel: 'info',
})
export class OrgNotAdminException extends AuthException {}

@RegisterException({
    code: OrgExceptionCode.ALREADY_MEMBER,
    statusCode: 409,
    message: '已经是该组织的成员',
    description: '用户尝试加入已经是成员的组织',
    retryable: false,
    logLevel: 'info',
})
export class OrgAlreadyMemberException extends ClientException {}

@RegisterException({
    code: OrgExceptionCode.ALREADY_APPLIED,
    statusCode: 409,
    message: '已经提交过申请',
    description: '用户已提交过加入组织的申请，重复申请',
    retryable: false,
    logLevel: 'info',
})
export class OrgAlreadyAppliedException extends ClientException {}

@RegisterException({
    code: OrgExceptionCode.OWNER_CANNOT_QUIT,
    statusCode: 400,
    message: '组织所有者不能退出组织，请先转让所有权',
    description: '组织所有者必须先将所有权转让给其他成员后才能退出',
    retryable: false,
    logLevel: 'info',
})
export class OwnerCannotQuitException extends ClientException {}

@RegisterException({
    code: OrgExceptionCode.CANNOT_PROMOTE_OWNER,
    statusCode: 400,
    message: '不能将成员提升为所有者',
    description: '通过角色变更不能直接提升成员为所有者',
    retryable: false,
    logLevel: 'info',
})
export class CannotPromoteOwnerException extends ClientException {}

@RegisterException({
    code: OrgExceptionCode.APPLICATION_NOT_FOUND,
    statusCode: 404,
    message: '申请/邀请记录不存在',
    description: '指定的申请或邀请记录未找到',
    retryable: false,
    logLevel: 'info',
})
export class ApplicationNotFoundException extends ClientException {}

export default {
    OrgNotFoundException,
    OrgNotOwnerException,
    OrgNotMemberException,
    OrgNotAdminException,
    OrgAlreadyMemberException,
    OrgAlreadyAppliedException,
    OwnerCannotQuitException,
    CannotPromoteOwnerException,
    ApplicationNotFoundException,
};
