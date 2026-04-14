import { ReagentService } from '@/modules/reagent/reagent.service.js';
import { ReagentRepository } from '@/modules/reagent/reagent.repository.js';
import { ReagentNotFoundException } from '@/modules/reagent/reagent.exception.js';

const mockReagentRepository: jest.Mocked<
    Pick<ReagentRepository, 'findById' | 'listByBoxId' | 'update'>
> = {
    findById: jest.fn(),
    listByBoxId: jest.fn(),
    update: jest.fn(),
};

const mockReagent = {
    id: 'reagent_1',
    boxId: 'box_1',
    position: 'A1',
    name: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('ReagentService', () => {
    let service: ReagentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ReagentService(mockReagentRepository as unknown as ReagentRepository);
    });

    describe('getOne', () => {
        it('should return reagent when found', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            const result = await service.getOne('reagent_1');
            expect(result).toEqual(mockReagent);
        });

        it('should throw ReagentNotFoundException when not found', async () => {
            mockReagentRepository.findById.mockResolvedValue(null);
            await expect(service.getOne('reagent_1')).rejects.toThrow(ReagentNotFoundException);
        });
    });

    describe('list', () => {
        it('should return reagents for box', async () => {
            mockReagentRepository.listByBoxId.mockResolvedValue([mockReagent]);
            const result = await service.list('box_1');
            expect(result).toEqual([mockReagent]);
            expect(mockReagentRepository.listByBoxId).toHaveBeenCalledWith('box_1');
        });
    });

    describe('update', () => {
        it('should update reagent name and description', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({
                ...mockReagent,
                name: 'Sample A',
                description: 'Test',
            });
            const result = await service.update({
                id: 'reagent_1',
                name: 'Sample A',
                description: 'Test',
            });
            expect(result.name).toBe('Sample A');
            expect(result.description).toBe('Test');
        });

        it('should update reagent position', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({ ...mockReagent, position: 'B2' });
            const result = await service.update({ id: 'reagent_1', position: 'B2' });
            expect(result.position).toBe('B2');
        });

        it('should throw ReagentNotFoundException when not found', async () => {
            mockReagentRepository.findById.mockResolvedValue(null);
            await expect(service.update({ id: 'reagent_1', name: 'X' })).rejects.toThrow(
                ReagentNotFoundException
            );
        });
    });
});
