import { AuthException, ClientException, RegisterException } from '@/common/exceptions/index.js';

export const UserExceptionCode = {
    NOT_FOUND: 'USER_NOT_FOUND',
    OLD_PASSWORD_WRONG: 'USER_OLD_PASSWORD_WRONG',
    EMAIL_SAME: 'USER_EMAIL_SAME',
    VERIFICATION_CODE_INVALID: 'VERIFICATION_CODE_INVALID',
    VERIFICATION_CODE_EXPIRED: 'VERIFICATION_CODE_EXPIRED',
    EMAIL_ALREADY_USED: 'EMAIL_ALREADY_USED',
} as const;

@RegisterException({
    code: UserExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '用户不存在',
    description: '指定的用户 ID 未找到匹配的账户',
    retryable: false,
    logLevel: 'info',
})
export class UserNotFoundException extends ClientException {}

@RegisterException({
    code: UserExceptionCode.OLD_PASSWORD_WRONG,
    statusCode: 400,
    message: '旧密码错误',
    description: '修改密码时提供的旧密码与当前密码不匹配',
    retryable: false,
    logLevel: 'info',
    hint: '请确认旧密码输入正确后重试',
})
export class OldPasswordWrongException extends AuthException {}

@RegisterException({
    code: UserExceptionCode.EMAIL_SAME,
    statusCode: 400,
    message: '新邮箱与当前邮箱相同',
    description: '修改邮箱时提供的新邮箱与当前邮箱一致',
    retryable: false,
    logLevel: 'info',
})
export class EmailSameException extends ClientException {}

@RegisterException({
    code: UserExceptionCode.VERIFICATION_CODE_INVALID,
    statusCode: 400,
    message: '验证码无效',
    description: '提供的邮箱验证码不正确或不存在',
    retryable: false,
    logLevel: 'info',
})
export class VerificationCodeInvalidException extends ClientException {}

@RegisterException({
    code: UserExceptionCode.VERIFICATION_CODE_EXPIRED,
    statusCode: 400,
    message: '验证码已过期',
    description: '验证码超过有效期（10 分钟），请重新发送',
    retryable: true,
    logLevel: 'info',
})
export class VerificationCodeExpiredException extends ClientException {}

@RegisterException({
    code: UserExceptionCode.EMAIL_ALREADY_USED,
    statusCode: 409,
    message: '该邮箱已被其他账号使用',
    description: '尝试绑定的新邮箱已存在于系统中',
    retryable: false,
    logLevel: 'warn',
})
export class EmailAlreadyUsedException extends ClientException {}

export default {
    UserNotFoundException,
    OldPasswordWrongException,
    EmailSameException,
    VerificationCodeInvalidException,
    VerificationCodeExpiredException,
    EmailAlreadyUsedException,
};
