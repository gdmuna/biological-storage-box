import type { Mocked } from 'vitest';
import { OrgController } from '@/modules/org/org.controller.js';
import { OrgService } from '@/modules/org/internal/org.service.js';

const mockOrgService: Mocked<
    Pick<OrgService, 'create' | 'delete' | 'getOne' | 'list' | 'search' | 'update'>
> = {
    create: vi.fn(),
    delete: vi.fn(),
    getOne: vi.fn(),
    list: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
};

const mockUser = { sub: 'user_1', username: 'test', iat: 0, exp: 0 } as any;

const mockOrg = {
    id: 'org_1',
    name: 'Test Org',
    description: 'desc',
    ownerId: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('OrgController', () => {
    let controller: OrgController;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new OrgController(mockOrgService as unknown as OrgService);
    });

    it('create: calls orgService.create and returns result', async () => {
        mockOrgService.create.mockResolvedValue(mockOrg);
        const result = await controller.create(mockUser, { name: 'Test Org' } as any);
        expect(mockOrgService.create).toHaveBeenCalledWith('user_1', { name: 'Test Org' });
        expect(result).toEqual(mockOrg);
    });

    it('delete: calls orgService.delete', async () => {
        mockOrgService.delete.mockResolvedValue(undefined);
        await controller.delete(mockUser, { orgId: 'org_1' } as any);
        expect(mockOrgService.delete).toHaveBeenCalledWith('user_1', 'org_1');
    });

    it('getOne: calls orgService.getOne and returns result', async () => {
        mockOrgService.getOne.mockResolvedValue(mockOrg as any);
        const result = await controller.getOne({ orgId: 'org_1' } as any);
        expect(mockOrgService.getOne).toHaveBeenCalledWith('org_1');
        expect(result).toEqual(mockOrg);
    });

    it('list: calls orgService.list and returns result', async () => {
        mockOrgService.list.mockResolvedValue([mockOrg] as any);
        const result = await controller.list(mockUser);
        expect(mockOrgService.list).toHaveBeenCalledWith('user_1');
        expect(result).toEqual([mockOrg]);
    });

    it('search: calls orgService.search and returns result', async () => {
        mockOrgService.search.mockResolvedValue([
            { id: 'org_1', name: 'Test Org', description: 'desc' },
        ]);
        const result = await controller.search({ keyword: 'Test', limit: 10 } as any);
        expect(mockOrgService.search).toHaveBeenCalledWith('Test', 10);
        expect(result).toHaveLength(1);
    });

    it('update: calls orgService.update and returns result', async () => {
        mockOrgService.update.mockResolvedValue(mockOrg);
        const result = await controller.update(mockUser, {
            orgId: 'org_1',
            name: 'Updated',
        } as any);
        expect(mockOrgService.update).toHaveBeenCalledWith('user_1', {
            orgId: 'org_1',
            name: 'Updated',
        });
        expect(result).toEqual(mockOrg);
    });
});
