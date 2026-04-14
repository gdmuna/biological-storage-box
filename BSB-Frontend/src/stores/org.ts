import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Org } from '@/schemas/org.schema';
import { listOrgs } from '@/api/modules/org';

export const useOrgStore = defineStore('org', () => {
    const orgs = ref<Org[]>([]);
    const currentOrgId = ref<string | null>(null);

    const currentOrg = computed(() => orgs.value.find((o) => o.id === currentOrgId.value) ?? null);

    async function fetchOrgs() {
        orgs.value = await listOrgs().send();
        if (!currentOrgId.value && orgs.value.length > 0) {
            currentOrgId.value = orgs.value[0].id;
        }
    }

    function selectOrg(id: string) {
        currentOrgId.value = id;
    }

    return { orgs, currentOrgId, currentOrg, fetchOrgs, selectOrg };
});
