import { OperationsService } from '@/modules/operations/operations.service.js';

describe('OperationsService', () => {
    const databaseService = {
        $queryRaw: vi.fn(),
    };
    const configService = {
        get: vi.fn((key: string) => (key === 'app.appVersion' ? '0.1.0' : 'test-commit')),
    };
    const requestContext = {
        get: vi.fn(),
        mergeContextMetadata: vi.fn(),
    };

    let service: OperationsService;

    beforeEach(() => {
        vi.clearAllMocks();
        databaseService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
        service = new OperationsService(
            databaseService as never,
            configService as never,
            requestContext as never
        );
    });

    it('returns the diagnostic greeting', () => {
        expect(service.getHello()).toBe('Hello World!');
        expect(requestContext.mergeContextMetadata).toHaveBeenCalled();
    });

    it('reports application and database health', async () => {
        await expect(service.getHealth()).resolves.toMatchObject({
            status: 'ok',
            version: '0.1.0',
            gitCommit: 'test-commit',
            components: { database: { status: 'ok' } },
        });
    });
});
