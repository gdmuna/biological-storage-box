export type StorageBucketKind = 'img' | 'share';

export interface StorageUploadInput {
    bucketKind: StorageBucketKind;
    key: string;
    body: Buffer;
    size: number;
    contentType?: string;
}

export interface StorageUploadResult {
    bucket: string;
    key: string;
    url: string;
    size: number;
    etag?: string;
}

export interface StorageOperationResult {
    name: string;
    supported: boolean;
    message: string;
}

export interface StorageCapabilityReport {
    endpoint: string;
    successCount: number;
    totalCount: number;
    operations: StorageOperationResult[];
}

export class StorageUploadError extends Error {
    readonly bucket: string;
    readonly key: string;

    constructor(params: { bucket: string; key: string; cause?: unknown; message?: string }) {
        super(params.message ?? 'Failed to upload object to storage', { cause: params.cause });
        this.name = 'StorageUploadError';
        this.bucket = params.bucket;
        this.key = params.key;
    }
}

export interface IStorageService {
    upload(input: StorageUploadInput): Promise<StorageUploadResult>;
    probeCapabilities(): Promise<StorageCapabilityReport>;
}
