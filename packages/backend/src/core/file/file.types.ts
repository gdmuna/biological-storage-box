import type { FileDomain } from '@root/prisma/generated/enums.js';

export interface CreateUploadSessionCommand {
    domain: FileDomain;
    contentType: string;
    filename: string;
    fileSize: number;
}

export interface CreateUploadSessionResult {
    fileId: string;
    uploadUrl: string;
}

export interface ConfirmUploadCommand {
    fileId: string;
}

export interface CreateDownloadUrlCommand {
    fileId: string;
    expiresIn: number;
}

export interface ServerUploadCommand {
    domain: FileDomain;
    filename: string;
}

export interface DeleteFilesCommand {
    fileIds: string[];
}

export interface CopyFileCommand {
    fileId: string;
    destDomain: FileDomain;
    destFilename?: string;
}
