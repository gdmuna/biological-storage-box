import { NodeController } from '../../src/modules/node/node.controller.js';
import { NodeService } from '../../src/modules/node/node.service.js';

describe('NodeController', () => {
    let controller: NodeController;
    let service: jest.Mocked<
        Pick<
            NodeService,
            'create' | 'delete' | 'getTree' | 'update' | 'setGridConfig' | 'removeGridConfig'
        >
    >;
    const user = { sub: 'user_01' } as any;

    beforeEach(() => {
        service = {
            create: jest.fn(),
            delete: jest.fn(),
            getTree: jest.fn(),
            update: jest.fn(),
            setGridConfig: jest.fn(),
            removeGridConfig: jest.fn(),
        };
        controller = new NodeController(service as any);
    });

    it('should call service.create', async () => {
        service.create.mockResolvedValue({ id: 'node_01' } as any);
        const result = await controller.create(user, {
            orgId: 'org_01',
            name: '冷冻室 A',
            type: 'CONTAINER',
        } as any);
        expect(service.create).toHaveBeenCalledWith('user_01', {
            orgId: 'org_01',
            name: '冷冻室 A',
            type: 'CONTAINER',
        });
        expect(result).toEqual({ id: 'node_01' });
    });

    it('should call service.delete', async () => {
        service.delete.mockResolvedValue(undefined);
        await controller.delete(user, { id: 'node_01' } as any);
        expect(service.delete).toHaveBeenCalledWith('user_01', 'node_01');
    });

    it('should call service.getTree and return flat list', async () => {
        const flat = [{ id: 'n1' }, { id: 'n2' }];
        service.getTree.mockResolvedValue(flat as any);
        const result = await controller.getTree({ orgId: 'org_01' } as any);
        expect(service.getTree).toHaveBeenCalledWith('org_01');
        expect(result).toEqual(flat);
    });

    it('should call service.update', async () => {
        service.update.mockResolvedValue({ id: 'node_01', name: 'Updated' } as any);
        const result = await controller.update(user, { id: 'node_01', name: 'Updated' } as any);
        expect(service.update).toHaveBeenCalledWith('user_01', { id: 'node_01', name: 'Updated' });
        expect(result).toEqual({ id: 'node_01', name: 'Updated' });
    });

    it('should call service.setGridConfig', async () => {
        service.setGridConfig.mockResolvedValue({ nodeId: 'node_01', rows: 9, cols: 9 } as any);
        const result = await controller.setGridConfig(user, {
            nodeId: 'node_01',
            rows: 9,
            cols: 9,
        } as any);
        expect(service.setGridConfig).toHaveBeenCalledWith('user_01', {
            nodeId: 'node_01',
            rows: 9,
            cols: 9,
        });
        expect(result).toEqual({ nodeId: 'node_01', rows: 9, cols: 9 });
    });

    it('should call service.removeGridConfig', async () => {
        service.removeGridConfig.mockResolvedValue(undefined);
        await controller.removeGridConfig(user, { nodeId: 'node_01' } as any);
        expect(service.removeGridConfig).toHaveBeenCalledWith('user_01', { nodeId: 'node_01' });
    });
});
