import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { listReagents, createReagent, updateReagent, deleteReagent } from '@/api/modules/reagent';
import {
    listReagentTypes,
    createReagentType,
    updateReagentType,
    deleteReagentType,
} from '@/api/modules/reagent-type';
import type { Reagent } from '@/schemas/reagent.schema';

export const useReagentStore = defineStore('reagent', () => {
    const reagents = ref<Reagent[]>([]);
    const reagentTypes = ref<any[]>([]);
    const loading = ref(false);

    async function initData(orgId: string, force = false) {
        loading.value = true;
        try {
            await getReagent({ orgId }, force);
            await getReagentType({ orgId }, force);
        } finally {
            loading.value = false;
        }
    }

    async function getReagent(params: { orgId?: string; nodeId?: string }, force = false) {
        const res = await listReagents(params).send(force);
        reagents.value = res;
        return res;
    }

    async function getReagentType(params: { orgId?: string; nodeId?: string }, force = false) {
        const res = await listReagentTypes(params).send(force);
        reagentTypes.value = res;
        return res;
    }

    async function addReagent(data: Parameters<typeof createReagent>[0]) {
        const created = await createReagent(data).send();
        reagents.value.push(created);
        return created;
    }

    async function addReagentType(data: Parameters<typeof createReagentType>[0]) {
        const created = await createReagentType(data).send();
        reagentTypes.value.push(created);
        return created;
    }

    async function editReagent(data: Parameters<typeof updateReagent>[0]) {
        const updated = await updateReagent(data).send();
        const index = reagents.value.findIndex((r) => r.id === updated.id);
        if (index !== -1) {
            reagents.value[index] = updated;
        }
        return updated;
    }

    async function editReagentType(data: Parameters<typeof updateReagentType>[0]) {
        const updated = await updateReagentType(data).send();
        const index = reagentTypes.value.findIndex((rt) => rt.id === updated.id);
        if (index !== -1) {
            reagentTypes.value[index] = updated;
        }
        return updated;
    }

    async function removeReagent(id: string | string[]) {
        await deleteReagent(id).send();
        const ids = Array.isArray(id) ? id : [id];
        reagents.value = reagents.value.filter((r) => !ids.includes(r.id));
    }

    async function removeReagentType(id: string | string[]) {
        await deleteReagentType(id).send();
        const ids = Array.isArray(id) ? id : [id];
        reagentTypes.value = reagentTypes.value.filter((rt) => !ids.includes(rt.id));
    }

    watch(
        () => reagents.value,
        (newval) => {
            console.log('reagents updated', newval);
        }
    );

    return {
        reagents,
        reagentTypes,
        loading,
        addReagent,
        addReagentType,
        editReagent,
        editReagentType,
        removeReagent,
        removeReagentType,
        initData,
    };
});
