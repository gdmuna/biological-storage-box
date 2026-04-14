import { BoxController } from '@/modules/box/box.controller.js';
import { BoxService } from '@/modules/box/box.service.js';

const mockBoxService: jest.Mocked<
    Pick<
        BoxService,
        'create' | 'delete' | 'getOne' | 'list' | 'listGroupedByRoot' | 'search' | 'update'
    >
> = {
    create: jest.fn(),
    delete: jest.fn(),
    getOne: jest.fn(),
    list: jest.fn(),
    listGroupedByRoot: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
};

const mockUser = { sub: 'user_1', username: 'test', iat: 0, exp: 0 } as any;
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

describe('BoxController', () => {
    let controller: BoxController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new BoxController(mockBoxService as unknown as BoxService);
    });

    it('create: calls boxService.create and returns result', async () => {
        mockBoxService.create.mockResolvedValue(mockBox as any);
        const result = await controller.create(mockUser, { orgId: 'org_1', name: 'Box A' } as any);
        expect(mockBoxService.create).toHaveBeenCalledWith('user_1', {
            orgId: 'org_1',
            name: 'Box A',
        });
        expect(result).toEqual(mockBox);
    });

    it('delete: calls boxService.delete', async () => {
        mockBoxService.delete.mockResolvedValue(undefined);
        await controller.delete(mockUser, { id: 'box_1' } as any);
        expect(mockBoxService.delete).toHaveBeenCalledWith('user_1', 'box_1');
    });

    it('getOne: calls boxService.getOne and returns result', async () => {
        mockBoxService.getOne.mockResolvedValue(mockBox as any);
        const result = await controller.getOne({ id: 'box_1' } as any);
        expect(mockBoxService.getOne).toHaveBeenCalledWith('box_1');
        expect(result).toEqual(mockBox);
    });

    it('list: calls boxService.list and returns result', async () => {
        mockBoxService.list.mockResolvedValue([mockBox] as any);
        const result = await controller.list({ orgId: 'org_1' } as any);
        expect(mockBoxService.list).toHaveBeenCalledWith('org_1');
        expect(result).toEqual([mockBox]);
    });

    it('listGroupedByRoot: calls boxService.listGroupedByRoot and returns result', async () => {
        const grouped = [{ rootId: null, rootName: null, boxes: [mockBox] }];
        mockBoxService.listGroupedByRoot.mockResolvedValue(grouped as any);
        const result = await controller.listGroupedByRoot({ orgId: 'org_1' } as any);
        expect(mockBoxService.listGroupedByRoot).toHaveBeenCalledWith('org_1');
        expect(result).toEqual(grouped);
    });

    it('search: calls boxService.search and returns result', async () => {
        mockBoxService.search.mockResolvedValue([mockBox] as any);
        const result = await controller.search({
            orgId: 'org_1',
            keyword: 'Box',
            limit: 10,
        } as any);
        expect(mockBoxService.search).toHaveBeenCalledWith({
            orgId: 'org_1',
            keyword: 'Box',
            limit: 10,
        });
        expect(result).toEqual([mockBox]);
    });

    it('update: calls boxService.update and returns result', async () => {
        mockBoxService.update.mockResolvedValue(mockBox as any);
        const result = await controller.update(mockUser, { id: 'box_1', name: 'Updated' } as any);
        expect(mockBoxService.update).toHaveBeenCalledWith('user_1', {
            id: 'box_1',
            name: 'Updated',
        });
        expect(result).toEqual(mockBox);
    });
});
