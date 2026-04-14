import { BoxService } from '@/modules/box/box.service.js';
import { BoxRepository } from '@/modules/box/box.repository.js';
import { BoxNotFoundException } from '@/modules/box/box.exception.js';
import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';

const mockBoxRepository: jest.Mocked<
    Pick<
        BoxRepository,
        | 'create'
        | 'findById'
        | 'findByIdWithDetail'
        | 'listByOrgId'
        | 'listGroupedByRoot'
        | 'search'
        | 'update'
        | 'delete'
    >
> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithDetail: jest.fn(),
    listByOrgId: jest.fn(),
    listGroupedByRoot: jest.fn(),
    search: jest.fn(),
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
const mockBox = {
    id: 'box_1',
    orgId: 'org_1',
    rootId: null,
    name: 'Box A',
    description: null,
    rows: 8,
    cols: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('BoxService', () => {
    let service: BoxService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new BoxService(
            mockBoxRepository as unknown as BoxRepository,
            mockOrgRepository as unknown as OrgRepository
        );
    });

    describe('create', () => {
        it('should create box when user is admin', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockBoxRepository.create.mockResolvedValue(mockBox as any);
            const result = await service.create('user_1', {
                orgId: 'org_1',
                name: 'Box A',
                rows: 8,
                cols: 12,
            });
            expect(result).toEqual(mockBox);
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            mockOrgRepository.findById.mockResolvedValue(null);
            await expect(
                service.create('user_1', { orgId: 'org_1', name: 'Box A' })
            ).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgNotAdminException when user is regular member', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'MEMBER' } as any);
            await expect(
                service.create('user_1', { orgId: 'org_1', name: 'Box A' })
            ).rejects.toThrow(OrgNotAdminException);
        });
    });

    describe('delete', () => {
        it('should delete box when user is admin', async () => {
            mockBoxRepository.findById.mockResolvedValue(mockBox);
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockBoxRepository.delete.mockResolvedValue(mockBox as any);
            await expect(service.delete('user_1', 'box_1')).resolves.toBeUndefined();
        });

        it('should throw BoxNotFoundException when box not found', async () => {
            mockBoxRepository.findById.mockResolvedValue(null);
            await expect(service.delete('user_1', 'box_1')).rejects.toThrow(BoxNotFoundException);
        });
    });

    describe('getOne', () => {
        it('should return box detail when found', async () => {
            const boxWithDetail = { ...mockBox, reagents: [] };
            mockBoxRepository.findByIdWithDetail.mockResolvedValue(boxWithDetail as any);
            const result = await service.getOne('box_1');
            expect(result).toEqual(boxWithDetail);
        });

        it('should throw BoxNotFoundException when not found', async () => {
            mockBoxRepository.findByIdWithDetail.mockResolvedValue(null);
            await expect(service.getOne('box_1')).rejects.toThrow(BoxNotFoundException);
        });
    });

    describe('list', () => {
        it('should return boxes for org', async () => {
            mockBoxRepository.listByOrgId.mockResolvedValue([mockBox] as any);
            const result = await service.list('org_1');
            expect(result).toEqual([mockBox]);
        });
    });

    describe('listGroupedByRoot', () => {
        it('should return grouped boxes', async () => {
            const grouped = [{ rootId: null, rootName: null, boxes: [mockBox] }];
            mockBoxRepository.listGroupedByRoot.mockResolvedValue(grouped as any);
            const result = await service.listGroupedByRoot('org_1');
            expect(result).toEqual(grouped);
        });
    });

    describe('search', () => {
        it('should return matching boxes', async () => {
            mockBoxRepository.search.mockResolvedValue([mockBox] as any);
            const result = await service.search({ orgId: 'org_1', keyword: 'Box', limit: 10 });
            expect(result).toEqual([mockBox]);
            expect(mockBoxRepository.search).toHaveBeenCalledWith('org_1', 'Box', 10);
        });
    });

    describe('update', () => {
        it('should update box and allow rootId null', async () => {
            mockBoxRepository.findById.mockResolvedValue(mockBox);
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            mockBoxRepository.update.mockResolvedValue({
                ...mockBox,
                rootId: null,
                name: 'Updated',
            } as any);
            const result = await service.update('user_1', {
                id: 'box_1',
                rootId: null,
                name: 'Updated',
            });
            expect(result.name).toBe('Updated');
            expect(result.rootId).toBeNull();
        });

        it('should throw BoxNotFoundException when box not found', async () => {
            mockBoxRepository.findById.mockResolvedValue(null);
            await expect(service.update('user_1', { id: 'box_1', name: 'New' })).rejects.toThrow(
                BoxNotFoundException
            );
        });
    });
});
