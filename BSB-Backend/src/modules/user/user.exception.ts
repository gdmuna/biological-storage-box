import { AuthException, ClientException, RegisterException } from '@/common/exceptions/index.js';

export const UserExceptionCode = {
    NOT_FOUND: 'USER_NOT_FOUND',
    OLD_PASSWORD_WRONG: 'USER_OLD_PASSWORD_WRONG',
    EMAIL_SAME: 'USER_EMAIL_SAME',
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

export default {
    UserNotFoundException,
    OldPasswordWrongException,
    EmailSameException,
};
