export interface StorageModuleOptions {
    options: S3ProviderOptions;
    imports?: any[];
}

export interface S3ProviderOptions {
    endpoint: string;
    region?: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
    bucketPublic: string;
    bucketPrivate: string;
    bucketStaging: string;
    publicBaseUrl?: string;
}

export interface StorageModuleAsyncOptions {
    useFactory?: (...args: any[]) => Promise<StorageModuleOptions> | StorageModuleOptions;
    // useClass?: any;
    // useExisting?: any;
    imports?: any[];
    inject?: any[];
}
