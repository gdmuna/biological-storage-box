import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchNodeTree, deleteNode, createNode, updateNode } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import type { Node } from '@/schemas/node.schema';

function buildTree(flat: Node[]): NodeItem[] {
    const map = new Map<string, NodeItem>();
    for (const n of flat) map.set(n.id, { ...n, children: [] });
    const roots: NodeItem[] = [];
    for (const n of flat) {
        const item = map.get(n.id)!;
        if (n.parentId) {
            map.get(n.parentId)?.children?.push(item);
        } else {
            roots.push(item);
        }
    }
    return roots;
}

export const useNodeStore = defineStore('node', () => {
    const nodes = ref<Node[]>([]);
    const loading = ref(false);

    const treeNodes = computed<NodeItem[]>(() => buildTree(nodes.value));

    async function addNode(data: Parameters<typeof createNode>[0]) {
        const created = await createNode(data).send();
        nodes.value.push(created);
        return created;
    }

    async function removeNode(nodeId: string) {
        await deleteNode(nodeId).send();
        nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    }

    async function editNode(data: Parameters<typeof updateNode>[0]) {
        const updated = await updateNode(data).send();
        const idx = nodes.value.findIndex((n) => n.id === updated.id);
        if (idx >= 0) nodes.value[idx] = updated;
        return updated;
    }

    async function fetchByOrg(orgId: string, force = false) {
        loading.value = true;
        try {
            const flat = await fetchNodeTree(orgId).send(force);
            nodes.value = flat;
        } finally {
            loading.value = false;
        }
        return nodes.value;
    }

    return { nodes, treeNodes, loading, addNode, removeNode, editNode, fetchByOrg };
});
