import { OperationsController } from '@/modules/operations/operations.controller.js';
import { OperationsService } from '@/modules/operations/operations.service.js';

describe('OperationsController', () => {
    const operationsService = {
        getHealth: vi.fn(),
    };
    const controller = new OperationsController(operationsService as unknown as OperationsService);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('delegates the health endpoint to OperationsService', async () => {
        operationsService.getHealth.mockResolvedValue({ status: 'ok' });

        await expect(controller.getHealth()).resolves.toEqual({ status: 'ok' });
        expect(operationsService.getHealth).toHaveBeenCalledOnce();
    });
});
