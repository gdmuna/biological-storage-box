import { RootController } from '@/modules/root/root.controller.js';
import { RootService } from '@/modules/root/root.service.js';

const mockRootService: jest.Mocked<
    Pick<RootService, 'create' | 'delete' | 'getOne' | 'list' | 'update'>
> = {
    create: jest.fn(),
    delete: jest.fn(),
    getOne: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
};

const mockUser = { sub: 'user_1', username: 'test', iat: 0, exp: 0 } as any;
const mockRoot = {
    id: 'root_1',
    orgId: 'org_1',
    name: 'Room A',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('RootController', () => {
    let controller: RootController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new RootController(mockRootService as unknown as RootService);
    });

    it('create: calls rootService.create and returns result', async () => {
        mockRootService.create.mockResolvedValue(mockRoot);
        const result = await controller.create(mockUser, { orgId: 'org_1', name: 'Room A' } as any);
        expect(mockRootService.create).toHaveBeenCalledWith('user_1', {
            orgId: 'org_1',
            name: 'Room A',
        });
        expect(result).toEqual(mockRoot);
    });

    it('delete: calls rootService.delete', async () => {
        mockRootService.delete.mockResolvedValue(undefined);
        await controller.delete(mockUser, { id: 'root_1' } as any);
        expect(mockRootService.delete).toHaveBeenCalledWith('user_1', 'root_1');
    });

    it('getOne: calls rootService.getOne and returns result', async () => {
        mockRootService.getOne.mockResolvedValue(mockRoot);
        const result = await controller.getOne({ id: 'root_1' } as any);
        expect(mockRootService.getOne).toHaveBeenCalledWith('root_1');
        expect(result).toEqual(mockRoot);
    });

    it('list: calls rootService.list and returns result', async () => {
        mockRootService.list.mockResolvedValue([mockRoot]);
        const result = await controller.list({ orgId: 'org_1' } as any);
        expect(mockRootService.list).toHaveBeenCalledWith('org_1');
        expect(result).toEqual([mockRoot]);
    });

    it('update: calls rootService.update and returns result', async () => {
        mockRootService.update.mockResolvedValue(mockRoot);
        const result = await controller.update(mockUser, { id: 'root_1', name: 'Updated' } as any);
        expect(mockRootService.update).toHaveBeenCalledWith('user_1', {
            id: 'root_1',
            name: 'Updated',
        });
        expect(result).toEqual(mockRoot);
    });
});
