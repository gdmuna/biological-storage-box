import { ClientException, InfraException, RegisterException } from '@/common/exceptions/index.js';

export const FileExceptionCode = {
    SCENE_INVALID: 'FILE_SCENE_INVALID',
    UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
} as const;

@RegisterException({
    code: FileExceptionCode.SCENE_INVALID,
    statusCode: 400,
    message: '上传场景无效',
    description: '上传场景仅支持 image / file / img / share，请检查后重试',
    retryable: false,
    logLevel: 'info',
})
export class InvalidFileSceneException extends ClientException {}

@RegisterException({
    code: FileExceptionCode.UPLOAD_FAILED,
    statusCode: 502,
    message: '对象存储上传失败',
    description: '文件写入对象存储失败，请检查 S3 服务状态后重试',
    retryable: true,
    logLevel: 'error',
})
export class FileUploadFailedException extends InfraException<{
    bucket: string;
    key: string;
}> {}

export default {
    InvalidFileSceneException,
    FileUploadFailedException,
};
