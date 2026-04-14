import { RootService } from '@/modules/root/root.service.js';
import { RootRepository } from '@/modules/root/root.repository.js';
import { RootNotFoundException } from '@/modules/root/root.exception.js';
import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';

const mockRootRepository: jest.Mocked<
    Pick<RootRepository, 'create' | 'findById' | 'listByOrgId' | 'update' | 'delete'>
> = {
    create: jest.fn(),
    findById: jest.fn(),
    listByOrgId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

const mockOrgRepository: jest.Mocked<Pick<OrgRepository, 'findById' | 'findMembership'>> = {
    findById: jest.fn(),
    findMembership: jest.fn(),
};

const mockOrg = {
    id: 'org_1',
    name: 'Test Org',
    ownerId: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
};
const mockRoot = {
    id: 'root_1',
    orgId: 'org_1',
    name: 'Room A',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('RootService', () => {
    let service: RootService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new RootService(
            mockRootRepository as unknown as RootRepository,
            mockOrgRepository as unknown as OrgRepository
        );
    });

    describe('create', () => {
        it('should create root when user is org admin', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            mockRootRepository.create.mockResolvedValue(mockRoot);
            const result = await service.create('user_1', { orgId: 'org_1', name: 'Room A' });
            expect(result).toEqual(mockRoot);
        });

        it('should create root when user is org owner', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockRootRepository.create.mockResolvedValue(mockRoot);
            const result = await service.create('user_1', { orgId: 'org_1', name: 'Room A' });
            expect(result).toEqual(mockRoot);
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            mockOrgRepository.findById.mockResolvedValue(null);
            await expect(
                service.create('user_1', { orgId: 'org_1', name: 'Room A' })
            ).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgNotAdminException when user is regular member', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'MEMBER' } as any);
            await expect(
                service.create('user_1', { orgId: 'org_1', name: 'Room A' })
            ).rejects.toThrow(OrgNotAdminException);
        });
    });

    describe('delete', () => {
        it('should delete root when user is admin', async () => {
            mockRootRepository.findById.mockResolvedValue(mockRoot);
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockRootRepository.delete.mockResolvedValue(mockRoot);
            await expect(service.delete('user_1', 'root_1')).resolves.toBeUndefined();
        });

        it('should throw RootNotFoundException when root not found', async () => {
            mockRootRepository.findById.mockResolvedValue(null);
            await expect(service.delete('user_1', 'root_1')).rejects.toThrow(RootNotFoundException);
        });
    });

    describe('getOne', () => {
        it('should return root when found', async () => {
            mockRootRepository.findById.mockResolvedValue(mockRoot);
            const result = await service.getOne('root_1');
            expect(result).toEqual(mockRoot);
        });

        it('should throw RootNotFoundException when not found', async () => {
            mockRootRepository.findById.mockResolvedValue(null);
            await expect(service.getOne('root_1')).rejects.toThrow(RootNotFoundException);
        });
    });

    describe('list', () => {
        it('should return roots for org', async () => {
            mockRootRepository.listByOrgId.mockResolvedValue([mockRoot]);
            const result = await service.list('org_1');
            expect(result).toEqual([mockRoot]);
            expect(mockRootRepository.listByOrgId).toHaveBeenCalledWith('org_1');
        });
    });

    describe('update', () => {
        it('should update root when user is admin', async () => {
            mockRootRepository.findById.mockResolvedValue(mockRoot);
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockRootRepository.update.mockResolvedValue({ ...mockRoot, name: 'Updated Room' });
            const result = await service.update('user_1', { id: 'root_1', name: 'Updated Room' });
            expect(result.name).toBe('Updated Room');
        });

        it('should throw RootNotFoundException when root not found', async () => {
            mockRootRepository.findById.mockResolvedValue(null);
            await expect(service.update('user_1', { id: 'root_1', name: 'New' })).rejects.toThrow(
                RootNotFoundException
            );
        });
    });
});
