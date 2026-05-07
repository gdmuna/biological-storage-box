import { AppService } from '@/app.service.js';

import allConfig from '@/constants/index.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { AlsService } from '@/infra/index.js';

import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

// Mock PinoLogger
const mockPinoLogger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
};

describe('AppService', () => {
    let service: AppService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: allConfig,
                }),
            ],
            providers: [
                AppService,
                DatabaseService,
                AlsService,
                {
                    provide: PinoLogger,
                    useValue: mockPinoLogger,
                },
            ],
        }).compile();
        service = module.get(AppService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return "Hello World!" from getHello()', () => {
        expect(service.getHello()).toBe('Hello World!');
    });

    it('getHealth should return status ok and timestamp', async () => {
        const res: any = await service.getHealth();
        expect(res).toHaveProperty('status', 'ok');
    });
});
