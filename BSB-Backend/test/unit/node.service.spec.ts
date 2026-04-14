import { NodeService } from '../../src/modules/node/node.service.js';
import { NodeRepository } from '../../src/modules/node/node.repository.js';
import { OrgRepository } from '../../src/modules/org/org.repository.js';
import {
    NodeNotFoundException,
    NodeCircularReferenceException,
} from '../../src/modules/node/node.exception.js';
import { OrgNotFoundException, OrgNotAdminException } from '../../src/modules/org/org.exception.js';

describe('NodeService', () => {
    let service: NodeService;
    let nodeRepo: jest.Mocked<
        Pick<
            NodeRepository,
            | 'create'
            | 'findById'
            | 'listByOrgId'
            | 'loadTree'
            | 'update'
            | 'delete'
            | 'isDescendant'
        >
    >;
    let orgRepo: jest.Mocked<Pick<OrgRepository, 'findById' | 'findMembership'>>;

    const userId = 'user_01';
    const orgId = 'org_01';
    const nodeId = 'node_01';

    beforeEach(() => {
        nodeRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            listByOrgId: jest.fn(),
            loadTree: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isDescendant: jest.fn(),
        };
        orgRepo = {
            findById: jest.fn(),
            findMembership: jest.fn(),
        };
        service = new NodeService(nodeRepo as any, orgRepo as any);
    });

    describe('create', () => {
        it('should create a root node when user is admin', async () => {
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            nodeRepo.create.mockResolvedValue({ id: nodeId, orgId, name: '冷冻室 A' } as any);

            const result = await service.create(userId, { orgId, name: '冷冻室 A' } as any);
            expect(result.id).toBe(nodeId);
            expect(nodeRepo.create).toHaveBeenCalledWith({
                orgId,
                name: '冷冻室 A',
                parentId: undefined,
                description: undefined,
            });
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            orgRepo.findById.mockResolvedValue(null);
            await expect(service.create(userId, { orgId, name: 'X' } as any)).rejects.toThrow(
                OrgNotFoundException
            );
        });

        it('should throw OrgNotAdminException when user is member only', async () => {
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'MEMBER' } as any);
            await expect(service.create(userId, { orgId, name: 'X' } as any)).rejects.toThrow(
                OrgNotAdminException
            );
        });
    });

    describe('delete', () => {
        it('should throw NodeNotFoundException when node not found', async () => {
            nodeRepo.findById.mockResolvedValue(null);
            await expect(service.delete(userId, nodeId)).rejects.toThrow(NodeNotFoundException);
        });
    });

    describe('update', () => {
        it('should throw NodeCircularReferenceException when moving to descendant', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            nodeRepo.isDescendant.mockResolvedValue(true);

            await expect(
                service.update(userId, { id: nodeId, parentId: 'child_node' } as any)
            ).rejects.toThrow(NodeCircularReferenceException);
        });
    });
});
