import { S3_OPTIONS } from './storage.constant.js';
import type { StorageModuleOptions, StorageModuleAsyncOptions } from './storage.interface.js';
import { StorageService } from './storage.service.js';

import { AllConfig } from '@/constants/index.js';

import { ConfigService } from '@nestjs/config';
import { Module, DynamicModule, Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule {
    static forRoot(options: StorageModuleOptions): DynamicModule {
        return {
            module: StorageModule,
            imports: options.imports || [],
            providers: [
                StorageService,
                { provide: S3_OPTIONS, useValue: options },
                this.createS3ClientProvider(),
            ],
            exports: [StorageService, S3Client, S3_OPTIONS],
        };
    }

    static forRootAsync(options: StorageModuleAsyncOptions): DynamicModule {
        return {
            module: StorageModule,
            imports: options.imports || [],
            providers: [
                StorageService,
                ...this.createAsyncOptionsProvider(options),
                this.createS3ClientProvider(),
            ],
            exports: [StorageService, S3Client, S3_OPTIONS],
        };
    }

    private static createS3ClientProvider(): Provider {
        return {
            provide: S3Client,
            useFactory: (
                opts: StorageModuleOptions | null,
                configService: ConfigService<AllConfig, true> | null
            ) => {
                let options = opts?.options;
                if (!options && configService) {
                    const storageConfig = configService.get('storage', { infer: true });
                    if (storageConfig) {
                        options = {
                            endpoint: storageConfig.endpoint,
                            region: storageConfig.region,
                            accessKeyId: storageConfig.accessKeyId,
                            secretAccessKey: storageConfig.secretAccessKey,
                            forcePathStyle: storageConfig.forcePathStyle,
                            bucketPublic: storageConfig.bucketPublic,
                            bucketPrivate: storageConfig.bucketPrivate,
                            bucketStaging: storageConfig.bucketStaging,
                        };
                    }
                }
                if (!options) return;
                return new S3Client({
                    endpoint: options.endpoint,
                    region: options.region || 'cn-east-1',
                    forcePathStyle: options.forcePathStyle || true,
                    credentials: {
                        accessKeyId: options.accessKeyId,
                        secretAccessKey: options.secretAccessKey,
                    },
                    // 禁止 SDK 自动为所有 PutObject 附加 CRC32 checksum，
                    // 避免预签名 URL 携带无效的 AAAAAA== 占位值。
                    // CAS 路径（getUploadUrlCAS）会显式指定 SHA256，不受影响。
                    requestChecksumCalculation: 'WHEN_REQUIRED',
                });
            },
            inject: [
                { token: S3_OPTIONS, optional: true },
                { token: ConfigService, optional: true },
            ],
        };
    }

    private static createAsyncOptionsProvider(options: StorageModuleAsyncOptions): Provider[] {
        const provider: Provider[] = [];
        if (options.useFactory) {
            provider.push({
                provide: S3_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            });
        }
        // else if (options.useClass) {
        //     provider.push({
        //         provide: S3_OPTIONS,
        //         useFactory: async (optionsFactory: any) => optionsFactory.createS3Options(),
        //         inject: [options.useClass],
        //     });
        // }
        // else if (options.useExisting) {
        //     provider.push({
        //         provide: S3_OPTIONS,
        //         useFactory: async (optionsFactory: any) => optionsFactory.createS3Options(),
        //         inject: [options.useExisting],
        //     });
        // }
        return provider;
    }
}
