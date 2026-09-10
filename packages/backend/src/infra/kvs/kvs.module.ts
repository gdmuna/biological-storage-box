import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvValkey from '@keyv/valkey';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                if (!process.env.KVS_URL) return {};
                const kvs = new KeyvValkey({
                    uri: process.env.KVS_URL,
                    useRedisSets: false,
                });
                return {
                    stores: [kvs],
                };
            },
            inject: [],
        }),
    ],
})
export class KvsModule {}
