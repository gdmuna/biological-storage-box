import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchNodeTree, deleteNode, createNode, updateNode } from '@/api/modules/node';
import { NodeItem } from '@/api/modules/node';
import { Node } from '@/schemas/node.schema';

function buildTree(flat: Node[]) {
    const map = new Map<string, NodeItem>();
    const ROOT_NODES: NodeItem[] = [];
    const BOX_NODES: NodeItem[] = [];
    const CONTAINER_NODES: NodeItem[] = [];
    const BOX_SLOT_NODES: NodeItem[] = [];
    for (const n of flat) {
        map.set(n.id, { ...n, children: [] });
        if (n.type === 'ROOT') ROOT_NODES.push(map.get(n.id)!);
        else if (n.type === 'BOX') BOX_NODES.push(map.get(n.id)!);
        else if (n.type === 'CONTAINER') CONTAINER_NODES.push(map.get(n.id)!);
        else if (n.type === 'BOX_SLOT') BOX_SLOT_NODES.push(map.get(n.id)!);
    }
    const roots: NodeItem[] = [];
    for (const n of flat) {
        const item = map.get(n.id)!;
        if (n.parentId) {
            map.get(n.parentId)?.children?.push(item);
        } else {
            roots.push(item);
        }
    }
    return {
        ROOT: ROOT_NODES,
        BOX: BOX_NODES,
        CONTAINER: CONTAINER_NODES,
        BOX_SLOT: BOX_SLOT_NODES,
        TREE: roots,
        MAP: map,
    };
}

export const useNodeStore = defineStore('node', () => {
    const nodes = ref<Node[]>([]);
    const loading = ref(false);

    const NODE_MAP = computed(() => buildTree(nodes.value));

    const treeNodes = computed(() => NODE_MAP.value.TREE);

    const rootNodes = computed(() => NODE_MAP.value.ROOT);

    const containerNodes = computed(() => NODE_MAP.value.CONTAINER);

    const boxNodes = computed(() => NODE_MAP.value.BOX);

    const boxSlotNodes = computed(() => NODE_MAP.value.BOX_SLOT);

    async function addNode(data: Parameters<typeof createNode>[0]) {
        const created = await createNode(data);
        nodes.value.push(created);
        return created;
    }

    async function removeNode(nodeId: string) {
        await deleteNode(nodeId);
        nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    }

    async function editNode(data: Parameters<typeof updateNode>[0]) {
        const updated = await updateNode(data);
        const idx = nodes.value.findIndex((n) => n.id === updated.id);
        if (idx >= 0) nodes.value[idx] = updated;
        return updated;
    }

    function getNodeDetail(nodeId: string) {
        return NODE_MAP.value.MAP.get(nodeId) ?? null;
    }

    async function fetchByOrg(orgId: string, _force = false) {
        loading.value = true;
        try {
            const flat = await fetchNodeTree(orgId);
            nodes.value = flat;
        } finally {
            loading.value = false;
        }
        return nodes.value;
    }

    return {
        nodes,
        treeNodes,
        rootNodes,
        containerNodes,
        boxNodes,
        boxSlotNodes,
        loading,
        addNode,
        removeNode,
        editNode,
        fetchByOrg,
        getNodeDetail,
    };
});
