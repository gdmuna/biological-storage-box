import { RegisterException } from '@/common/exceptions/exception-registry.js';
import { InfraException, ClientException } from '@/common/exceptions/app.exception.js';

export const StorageExceptionCode = {
    UPLOAD_FAILED: 'STORAGE_UPLOAD_FAILED',
    DOWNLOAD_FAILED: 'STORAGE_DOWNLOAD_FAILED',
    DELETE_FAILED: 'STORAGE_DELETE_FAILED',
    OBJECT_NOT_FOUND: 'STORAGE_OBJECT_NOT_FOUND',
    MULTIPART_INIT_FAILED: 'STORAGE_MULTIPART_INIT_FAILED',
    MULTIPART_COMPLETE_FAILED: 'STORAGE_MULTIPART_COMPLETE_FAILED',
    MULTIPART_ABORT_FAILED: 'STORAGE_MULTIPART_ABORT_FAILED',
    INVALID_BUCKET: 'STORAGE_INVALID_BUCKET',
} as const;

/**
 * 对象存储异常中间基类。
 * 所有 S3 操作错误在 StorageService 内被捕获后包装为此类的子类。
 */
export abstract class StorageException extends InfraException {}

@RegisterException({
    code: StorageExceptionCode.UPLOAD_FAILED,
    statusCode: 500,
    message: '文件上传失败',
    description: 'S3 对象上传操作失败，可能由网络超时、凭证失效或存储桶配置错误引起',
    retryable: true,
    logLevel: 'error',
    causes: ['S3 服务不可达', '访问密钥过期或无效', '存储桶权限配置错误'],
    hint: '检查 S3 端点配置及访问凭证是否有效，确认目标存储桶存在且有写入权限',
})
export class StorageUploadFailedException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.DOWNLOAD_FAILED,
    statusCode: 500,
    message: '文件下载失败',
    description: 'S3 对象下载操作失败，可能由网络超时、凭证失效或对象不存在引起',
    retryable: true,
    logLevel: 'error',
    causes: ['S3 服务不可达', '访问密钥过期或无效', '对象 Key 不存在'],
    hint: '确认对象 Key 正确，检查 S3 端点配置及读取权限',
})
export class StorageDownloadFailedException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.DELETE_FAILED,
    statusCode: 500,
    message: '文件删除失败',
    description: 'S3 对象删除操作失败，可能由网络超时、凭证失效或权限不足引起',
    retryable: true,
    logLevel: 'error',
    causes: ['S3 服务不可达', '访问密钥无删除权限', '存储桶策略拒绝删除操作'],
    hint: '检查 IAM 策略或存储桶策略是否授予了 s3:DeleteObject 权限',
})
export class StorageDeleteFailedException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.OBJECT_NOT_FOUND,
    statusCode: 404,
    message: '文件不存在',
    description: '目标 S3 对象不存在或已被删除',
    retryable: false,
    logLevel: 'warn',
    causes: ['对象 Key 错误', '文件已被删除', '存储桶名称错误'],
    hint: '确认文件 Key 和存储桶名称正确，检查文件是否已上传成功',
})
export class StorageObjectNotFoundException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.MULTIPART_INIT_FAILED,
    statusCode: 500,
    message: '分片上传初始化失败',
    description: 'S3 Multipart Upload 初始化失败，无法获取 UploadId',
    retryable: true,
    logLevel: 'error',
    causes: ['S3 服务不可达', '存储桶权限不足', '存储桶不存在'],
    hint: '检查存储桶是否存在，确认凭证具有 s3:CreateMultipartUpload 权限',
})
export class StorageMultipartInitFailedException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.MULTIPART_COMPLETE_FAILED,
    statusCode: 500,
    message: '分片上传合并失败',
    description: 'S3 CompleteMultipartUpload 操作失败，可能由分片 ETag 不匹配或 UploadId 失效引起',
    retryable: false,
    logLevel: 'error',
    causes: ['部分分片未成功上传', 'ETag 与服务端记录不匹配', 'UploadId 已过期或不存在'],
    hint: '检查所有分片是否已上传成功，确认 ETag 列表与实际上传结果一致',
})
export class StorageMultipartCompleteFailedException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.MULTIPART_ABORT_FAILED,
    statusCode: 500,
    message: '分片上传取消失败',
    description: 'S3 AbortMultipartUpload 操作失败，临时分片可能未被清理',
    retryable: true,
    logLevel: 'error',
    hint: '稍后重试或手动在 S3 控制台清理未完成的 Multipart Upload',
})
export class StorageMultipartAbortFailedException extends StorageException {}

@RegisterException({
    code: StorageExceptionCode.INVALID_BUCKET,
    statusCode: 400,
    message: '无效的存储桶类型',
    description: '请求的存储桶类型不在允许范围内，必须为 public 或 private',
    retryable: false,
    logLevel: 'warn',
})
export class StorageInvalidBucketException extends ClientException {}

export default {
    StorageUploadFailedException,
    StorageDownloadFailedException,
    StorageDeleteFailedException,
    StorageObjectNotFoundException,
    StorageMultipartInitFailedException,
    StorageMultipartCompleteFailedException,
    StorageMultipartAbortFailedException,
    StorageInvalidBucketException,
};
