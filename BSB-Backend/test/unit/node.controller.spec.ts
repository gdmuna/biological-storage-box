import { NodeController } from '../../src/modules/node/node.controller.js';
import { NodeService } from '../../src/modules/node/node.service.js';

describe('NodeController', () => {
    let controller: NodeController;
    let service: jest.Mocked<
        Pick<NodeService, 'create' | 'delete' | 'getOne' | 'list' | 'getTree' | 'update'>
    >;
    const user = { sub: 'user_01' } as any;

    beforeEach(() => {
        service = {
            create: jest.fn(),
            delete: jest.fn(),
            getOne: jest.fn(),
            list: jest.fn(),
            getTree: jest.fn(),
            update: jest.fn(),
        };
        controller = new NodeController(service as any);
    });

    it('should call service.create', async () => {
        service.create.mockResolvedValue({ id: 'node_01' } as any);
        const result = await controller.create(user, {
            orgId: 'org_01',
            name: '冷冻室 A',
        } as any);
        expect(service.create).toHaveBeenCalledWith('user_01', {
            orgId: 'org_01',
            name: '冷冻室 A',
        });
        expect(result).toEqual({ id: 'node_01' });
    });

    it('should call service.getTree', async () => {
        service.getTree.mockResolvedValue([] as any);
        const result = await controller.getTree({ orgId: 'org_01' } as any);
        expect(service.getTree).toHaveBeenCalledWith('org_01');
        expect(result).toEqual([]);
    });
});
