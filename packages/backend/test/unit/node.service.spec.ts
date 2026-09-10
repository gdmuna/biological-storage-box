import type { Mocked } from 'vitest';
import { NodeService } from '@/modules/node/internal/node.service.js';
import { NodeRepository } from '@/modules/node/internal/node.repository.js';
import { OrgKernel } from '@/modules/org/org.kernel.js';
import {
    NodeNotFoundException,
    NodeCircularReferenceException,
} from '../../src/modules/node/node.exception.js';
import { OrgNotFoundException, OrgNotAdminException } from '../../src/modules/org/org.exception.js';

describe('NodeService', () => {
    let service: NodeService;
    let nodeRepo: Mocked<
        Pick<
            NodeRepository,
            | 'create'
            | 'findById'
            | 'loadTree'
            | 'update'
            | 'delete'
            | 'isDescendant'
            | 'setGridConfig'
            | 'removeGridConfig'
        >
    >;
    let orgKernel: Mocked<Pick<OrgKernel, 'assertAdmin'>>;

    const userId = 'user_01';
    const orgId = 'org_01';
    const nodeId = 'node_01';

    beforeEach(() => {
        nodeRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            loadTree: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            isDescendant: vi.fn(),
            setGridConfig: vi.fn(),
            removeGridConfig: vi.fn(),
        };
        orgKernel = {
            assertAdmin: vi.fn(),
        };
        service = new NodeService(nodeRepo as any, orgKernel as any);
    });

    describe('create', () => {
        it('should create a node when user is admin', async () => {
            nodeRepo.create.mockResolvedValue({ id: nodeId, orgId, name: '冷冻室 A' } as any);

            const result = await service.create(userId, {
                orgId,
                name: '冷冻室 A',
                type: 'CONTAINER',
            } as any);
            expect(result.id).toBe(nodeId);
            expect(nodeRepo.create).toHaveBeenCalledWith({
                orgId,
                name: '冷冻室 A',
                type: 'CONTAINER',
                parentId: undefined,
                description: undefined,
                metadata: undefined,
            });
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            orgKernel.assertAdmin.mockRejectedValue(new OrgNotFoundException());
            await expect(
                service.create(userId, { orgId, name: 'X', type: 'CONTAINER' } as any)
            ).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgNotAdminException when user is member only', async () => {
            orgKernel.assertAdmin.mockRejectedValue(new OrgNotAdminException());
            await expect(
                service.create(userId, { orgId, name: 'X', type: 'CONTAINER' } as any)
            ).rejects.toThrow(OrgNotAdminException);
        });
    });

    describe('delete', () => {
        it('should throw NodeNotFoundException when node not found', async () => {
            nodeRepo.findById.mockResolvedValue(null);
            await expect(service.delete(userId, nodeId)).rejects.toThrow(NodeNotFoundException);
        });

        it('should delete node when user is admin', async () => {
            nodeRepo.findById.mockResolvedValue({ id: nodeId, orgId } as any);
            nodeRepo.delete.mockResolvedValue(undefined as any);

            await service.delete(userId, nodeId);
            expect(nodeRepo.delete).toHaveBeenCalledWith(nodeId);
        });
    });

    describe('getTree', () => {
        it('should return flat node list', async () => {
            const flat = [
                { id: 'n1', orgId, parentId: null },
                { id: 'n2', orgId, parentId: 'n1' },
            ];
            nodeRepo.loadTree.mockResolvedValue(flat as any);
            const result = await service.getTree(orgId);
            expect(result).toEqual(flat);
            expect(nodeRepo.loadTree).toHaveBeenCalledWith(orgId);
        });
    });

    describe('update', () => {
        it('should throw NodeCircularReferenceException when moving to descendant', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            nodeRepo.isDescendant.mockResolvedValue(true);

            await expect(
                service.update(userId, { id: nodeId, parentId: 'child_node' } as any)
            ).rejects.toThrow(NodeCircularReferenceException);
        });

        it('should throw NodeCircularReferenceException when moving to self', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            await expect(
                service.update(userId, { id: nodeId, parentId: nodeId } as any)
            ).rejects.toThrow(NodeCircularReferenceException);
        });

        it('should update node when no circular reference', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            nodeRepo.isDescendant.mockResolvedValue(false);
            nodeRepo.update.mockResolvedValue({ id: nodeId, name: 'Updated' } as any);

            const result = await service.update(userId, {
                id: nodeId,
                parentId: 'other_node',
                name: 'Updated',
            } as any);
            expect(result.name).toBe('Updated');
        });
    });

    describe('setGridConfig', () => {
        it('should throw NodeNotFoundException when node not found', async () => {
            nodeRepo.findById.mockResolvedValue(null);
            await expect(
                service.setGridConfig(userId, { nodeId, rows: 9, cols: 9 })
            ).rejects.toThrow(NodeNotFoundException);
        });

        it('should set grid config when user is admin', async () => {
            nodeRepo.findById.mockResolvedValue({ id: nodeId, orgId } as any);
            nodeRepo.setGridConfig.mockResolvedValue({ nodeId, rows: 9, cols: 9 } as any);

            const result = await service.setGridConfig(userId, { nodeId, rows: 9, cols: 9 });
            expect(result).toEqual({ nodeId, rows: 9, cols: 9 });
        });
    });

    describe('removeGridConfig', () => {
        it('should remove grid config when user is admin', async () => {
            nodeRepo.findById.mockResolvedValue({ id: nodeId, orgId } as any);
            nodeRepo.removeGridConfig.mockResolvedValue(undefined as any);

            await service.removeGridConfig(userId, { nodeId });
            expect(nodeRepo.removeGridConfig).toHaveBeenCalledWith(nodeId);
        });
    });
});
