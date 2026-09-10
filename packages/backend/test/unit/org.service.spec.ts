import type { Mocked } from 'vitest';
import { OrgService } from '@/modules/org/internal/org.service.js';
import { OrgRepository } from '@/modules/org/internal/org.repository.js';
import {
    OrgNotFoundException,
    OrgNotOwnerException,
    OrgNotAdminException,
} from '@/modules/org/org.exception.js';

const mockOrgRepository: Mocked<
    Pick<
        OrgRepository,
        | 'create'
        | 'findById'
        | 'findByIdWithOwner'
        | 'listByUserId'
        | 'search'
        | 'update'
        | 'delete'
        | 'findMembership'
    >
> = {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdWithOwner: vi.fn(),
    listByUserId: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMembership: vi.fn(),
};

const mockOrg = {
    id: 'org_1',
    name: 'Test Org',
    description: 'desc',
    ownerId: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('OrgService', () => {
    let service: OrgService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new OrgService(mockOrgRepository as unknown as OrgRepository);
    });

    describe('create', () => {
        it('should return org on success', async () => {
            mockOrgRepository.create.mockResolvedValue(mockOrg);
            const result = await service.create('user_1', { name: 'Test Org' });
            expect(result).toEqual(mockOrg);
            expect(mockOrgRepository.create).toHaveBeenCalledWith({
                name: 'Test Org',
                description: undefined,
                ownerId: 'user_1',
            });
        });

        it('should propagate repository errors', async () => {
            mockOrgRepository.create.mockRejectedValue(new Error('DB error'));
            await expect(service.create('user_1', { name: 'Test Org' })).rejects.toThrow(
                'DB error'
            );
        });
    });

    describe('delete', () => {
        it('should delete org when caller is owner', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.delete.mockResolvedValue(mockOrg);
            await expect(service.delete('user_1', 'org_1')).resolves.toBeUndefined();
            expect(mockOrgRepository.delete).toHaveBeenCalledWith('org_1');
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            mockOrgRepository.findById.mockResolvedValue(null);
            await expect(service.delete('user_1', 'org_1')).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgNotOwnerException when caller is not owner', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            await expect(service.delete('other_user', 'org_1')).rejects.toThrow(
                OrgNotOwnerException
            );
        });
    });

    describe('getOne', () => {
        it('should return org with owner when found', async () => {
            const orgWithOwner = {
                ...mockOrg,
                owner: { id: 'user_1', username: 'test', nickname: null },
            };
            mockOrgRepository.findByIdWithOwner.mockResolvedValue(orgWithOwner);
            const result = await service.getOne('org_1');
            expect(result).toEqual(orgWithOwner);
        });

        it('should throw OrgNotFoundException when not found', async () => {
            mockOrgRepository.findByIdWithOwner.mockResolvedValue(null);
            await expect(service.getOne('org_1')).rejects.toThrow(OrgNotFoundException);
        });
    });

    describe('list', () => {
        it('should return orgs for user', async () => {
            mockOrgRepository.listByUserId.mockResolvedValue([mockOrg] as any);
            const result = await service.list('user_1');
            expect(result).toEqual([mockOrg]);
            expect(mockOrgRepository.listByUserId).toHaveBeenCalledWith('user_1');
        });
    });

    describe('search', () => {
        it('should return matching orgs', async () => {
            mockOrgRepository.search.mockResolvedValue([
                { id: 'org_1', name: 'Test Org', description: 'desc' },
            ]);
            const result = await service.search('Test', 10);
            expect(result).toHaveLength(1);
            expect(mockOrgRepository.search).toHaveBeenCalledWith('Test', 10);
        });
    });

    describe('update', () => {
        it('should update org when user is admin', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            mockOrgRepository.update.mockResolvedValue({ ...mockOrg, name: 'Updated' });
            const result = await service.update('user_1', { orgId: 'org_1', name: 'Updated' });
            expect(result.name).toBe('Updated');
        });

        it('should update org when user is owner', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockOrgRepository.update.mockResolvedValue({ ...mockOrg, name: 'Updated' });
            const result = await service.update('user_1', { orgId: 'org_1', name: 'Updated' });
            expect(result.name).toBe('Updated');
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            mockOrgRepository.findById.mockResolvedValue(null);
            await expect(service.update('user_1', { orgId: 'org_1', name: 'New' })).rejects.toThrow(
                OrgNotFoundException
            );
        });

        it('should throw OrgNotAdminException when user is regular member', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'MEMBER' } as any);
            await expect(service.update('user_1', { orgId: 'org_1', name: 'New' })).rejects.toThrow(
                OrgNotAdminException
            );
        });

        it('should throw OrgNotAdminException when user has no membership', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue(null);
            await expect(service.update('user_1', { orgId: 'org_1', name: 'New' })).rejects.toThrow(
                OrgNotAdminException
            );
        });
    });
});
