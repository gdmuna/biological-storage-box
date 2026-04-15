import { defineStore } from 'pinia';
import { ref } from 'vue';
import { filterNodes, deleteNode, createNode, updateNode } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';

export const useNodeStore = defineStore('node', () => {
    const nodes = ref<NodeItem[]>([]);
    const loading = ref(false);

    async function fetchByOrg(orgId: string) {
        loading.value = true;
        try {
            nodes.value = await filterNodes({ orgId }).send();
        } finally {
            loading.value = false;
        }
    }

    async function fetchRooms(orgId: string) {
        loading.value = true;
        try {
            nodes.value = await filterNodes({ orgId, type: 'ROOM' }).send();
        } finally {
            loading.value = false;
        }
    }

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

    return { nodes, loading, fetchByOrg, fetchRooms, addNode, removeNode, editNode };
});
