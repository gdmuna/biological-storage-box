import { Logger } from '@/common/services/index.js';

import { AllConfig } from '@/constants/index.js';

import { DatabaseService, AlsService } from '@/infra/index.js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { uptime } from 'node:process';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly configService: ConfigService<AllConfig, true>,
        private readonly alsService: AlsService
    ) {}

    getHello() {
        this.logger.verbose('Handling getHello request');
        this.alsService.get(); // 确保上下文已初始化
        this.alsService.mergeContextMetadata({
            exampleKey: '666',
            ccc: { aaa: 'wtf' },
        });
        this.alsService.mergeContextMetadata({ exampleKey: 'exampleValue' });
        this.alsService.mergeContextMetadata({ ccc: { bbb: 'omg', aaa: '999' } });
        return 'Hello World!';
    }

    async getHealth() {
        const databaseHealth = await this.checkDatabaseHealth();
        return {
            status: 'ok',
            uptime: uptime(),
            version: this.configService.get('app.appVersion', { infer: true }),
            gitCommit: this.configService.get('app.gitCommit', { infer: true }),
            components: {
                database: {
                    ...databaseHealth,
                },
            },
        };
    }

    private async checkDatabaseHealth(timeout = 3000) {
        const start = Date.now();
        let timer: NodeJS.Timeout | null = null;
        try {
            await Promise.race([
                this.databaseService.$queryRaw`SELECT 1`,
                new Promise(
                    (_, reject) =>
                        (timer = setTimeout(() => reject(new Error('Database timeout')), timeout))
                ),
            ]);
            return {
                status: 'ok',
                responseTimeMs: Date.now() - start,
            };
        } catch (error) {
            return {
                status: 'down',
                responseTimeMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}
