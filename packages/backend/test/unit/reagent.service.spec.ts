import type { Mocked } from 'vitest';
import { ReagentService } from '@/modules/reagent/internal/reagent.service.js';
import { ReagentRepository } from '@/modules/reagent/internal/reagent.repository.js';
import { ReagentNotFoundException } from '@/modules/reagent/reagent.exception.js';

const mockReagentRepository: Mocked<
    Pick<ReagentRepository, 'findById' | 'list' | 'update' | 'create'>
> = {
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
};

const mockReagent = {
    id: 'reagent_1',
    nodeId: 'node_1',
    orgId: 'org_1',
    position: '1-1',
    name: 'Test Reagent',
    description: null,
    reagentTypeId: null,
    placedAt: null,
    lastTakenAt: null,
    environment: null,
    responsibleUserId: null,
    quantity: null,
    unit: null,
    expiryDate: null,
    manufactureDate: null,
    batchNo: null,
    catalogNo: null,
    manufacturer: null,
    casNumber: null,
    storageCondition: null,
    hazardLevel: null,
    minStockThreshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('ReagentService', () => {
    let service: ReagentService;

    beforeEach(() => {
        vi.clearAllMocks();
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
        it('should return reagents for node', async () => {
            mockReagentRepository.list.mockResolvedValue([mockReagent] as any);
            const result = await service.list(undefined, 'node_1');
            expect(result).toEqual([mockReagent]);
            expect(mockReagentRepository.list).toHaveBeenCalledWith(undefined, 'node_1');
        });

        it('should return reagents for org', async () => {
            mockReagentRepository.list.mockResolvedValue([mockReagent] as any);
            const result = await service.list('org_1');
            expect(result).toEqual([mockReagent]);
            expect(mockReagentRepository.list).toHaveBeenCalledWith('org_1', undefined);
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
            mockReagentRepository.update.mockResolvedValue({ ...mockReagent, position: '2-3' });
            const result = await service.update({ id: 'reagent_1', position: '2-3' });
            expect(result.position).toBe('2-3');
        });

        it('should update new P0 fields: quantity, unit, batchNo', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({
                ...mockReagent,
                quantity: 50.5,
                unit: 'mL',
                batchNo: 'BATCH001',
            });
            const result = await service.update({
                id: 'reagent_1',
                quantity: 50.5,
                unit: 'mL',
                batchNo: 'BATCH001',
            });
            expect(result.quantity).toBe(50.5);
            expect(result.unit).toBe('mL');
            expect(result.batchNo).toBe('BATCH001');
            expect(mockReagentRepository.update).toHaveBeenCalledWith(
                'reagent_1',
                expect.objectContaining({
                    quantity: 50.5,
                    unit: 'mL',
                    batchNo: 'BATCH001',
                })
            );
        });

        it('should update expiryDate as Date object', async () => {
            const expiryIso = '2027-01-01T00:00:00.000Z';
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({
                ...mockReagent,
                expiryDate: new Date(expiryIso),
            });
            const result = await service.update({ id: 'reagent_1', expiryDate: expiryIso });
            expect(mockReagentRepository.update).toHaveBeenCalledWith(
                'reagent_1',
                expect.objectContaining({
                    expiryDate: new Date(expiryIso),
                })
            );
            expect(result.expiryDate).toEqual(new Date(expiryIso));
        });

        it('should set expiryDate to null when null is passed', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({ ...mockReagent, expiryDate: null });
            await service.update({ id: 'reagent_1', expiryDate: null });
            expect(mockReagentRepository.update).toHaveBeenCalledWith(
                'reagent_1',
                expect.objectContaining({
                    expiryDate: null,
                })
            );
        });

        it('should update hazardLevel', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({
                ...mockReagent,
                hazardLevel: 'GHS06',
            });
            const result = await service.update({ id: 'reagent_1', hazardLevel: 'GHS06' });
            expect(result.hazardLevel).toBe('GHS06');
        });

        it('should update minStockThreshold', async () => {
            mockReagentRepository.findById.mockResolvedValue(mockReagent);
            mockReagentRepository.update.mockResolvedValue({
                ...mockReagent,
                minStockThreshold: 10,
            });
            const result = await service.update({ id: 'reagent_1', minStockThreshold: 10 });
            expect(result.minStockThreshold).toBe(10);
        });

        it('should throw ReagentNotFoundException when not found', async () => {
            mockReagentRepository.findById.mockResolvedValue(null);
            await expect(service.update({ id: 'reagent_1', name: 'X' })).rejects.toThrow(
                ReagentNotFoundException
            );
        });
    });

    describe('create', () => {
        it('should create reagent with P0 fields', async () => {
            const created = { ...mockReagent, quantity: 100, unit: 'mg', casNumber: '50-00-0' };
            mockReagentRepository.create.mockResolvedValue(created);
            const result = await service.create({
                nodeId: 'node_1',
                position: '1-1',
                name: 'Formaldehyde',
                quantity: 100,
                unit: 'mg',
                casNumber: '50-00-0',
            });
            expect(result.quantity).toBe(100);
            expect(result.unit).toBe('mg');
            expect(result.casNumber).toBe('50-00-0');
        });

        it('should throw ReagentNotFoundException when create returns null (node not found)', async () => {
            mockReagentRepository.create.mockResolvedValue(null);
            await expect(
                service.create({ nodeId: 'invalid_node', position: '1-1', name: 'X' })
            ).rejects.toThrow(ReagentNotFoundException);
        });
    });
});
