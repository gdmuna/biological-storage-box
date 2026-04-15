import { Module } from '@nestjs/common';

import { S3StorageService } from './s3-storage.service.js';
import { STORAGE_SERVICE } from './storage.constants.js';

@Module({
    providers: [
        S3StorageService,
        {
            provide: STORAGE_SERVICE,
            useExisting: S3StorageService,
        },
    ],
    exports: [STORAGE_SERVICE, S3StorageService],
})
export class StorageModule {}
