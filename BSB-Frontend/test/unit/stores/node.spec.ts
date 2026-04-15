import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNodeStore } from '@/stores/node';

vi.mock('@/api/modules/node', () => ({
    filterNodes: () => ({
        send: () =>
            Promise.resolve([
                {
                    id: 'n1',
                    name: 'Room A',
                    type: 'ROOM',
                    parentId: null,
                    orgId: 'org-1',
                    metadata: null,
                    gridConfig: null,
                    description: null,
                    createdAt: '',
                    updatedAt: '',
                },
            ]),
    }),
    createNode: () => ({
        send: () =>
            Promise.resolve({
                id: 'n2',
                name: 'Box 1',
                type: 'BOX',
                parentId: 'n1',
                orgId: 'org-1',
                metadata: null,
                gridConfig: null,
                description: null,
                createdAt: '',
                updatedAt: '',
            }),
    }),
    deleteNode: () => ({ send: () => Promise.resolve() }),
    updateNode: () => ({
        send: () =>
            Promise.resolve({
                id: 'n1',
                name: 'Room A Updated',
                type: 'ROOM',
                parentId: null,
                orgId: 'org-1',
                metadata: null,
                gridConfig: null,
                description: null,
                createdAt: '',
                updatedAt: '',
            }),
    }),
    getNodeTree: () => ({ send: () => Promise.resolve([]) }),
}));

describe('useNodeStore', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('fetchByOrg loads nodes', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        expect(store.nodes.length).toBe(1);
        expect(store.nodes[0].type).toBe('ROOM');
    });

    it('addNode appends to list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.addNode({ orgId: 'org-1', name: 'Box 1', type: 'BOX', parentId: 'n1' });
        expect(store.nodes.length).toBe(2);
    });

    it('removeNode removes from list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.removeNode('n1');
        expect(store.nodes.length).toBe(0);
    });
});
