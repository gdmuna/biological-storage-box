import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Org } from '@/schemas/org.schema';
import { listOrgs, createOrg, exploreOrgs, searchOrgMembers } from '@/api/modules/org';
import type { CreateOrgForm } from '@/schemas/org.schema';

export const useOrgStore = defineStore('org', () => {
    const orgs = ref<Org[]>([]);
    const currentOrgId = ref<string | null>(null);

    const currentOrg = computed(() => orgs.value.find((o) => o.id === currentOrgId.value) ?? null);

    async function fetchOrgs() {
        const res = await listOrgs();
        orgs.value = res;
        console.log('Fetched orgs:', res);
        if (!currentOrgId.value && orgs.value.length > 0) {
            currentOrgId.value = orgs.value[0].id;
        } else if (!orgs.value.length) {
            currentOrgId.value = null;
        } else if (currentOrgId.value && !orgs.value.some((o) => o.id === currentOrgId.value)) {
            currentOrgId.value = orgs.value[0].id;
        }
    }

    function selectOrg(id: string) {
        currentOrgId.value = id;
    }

    /** 创建组织后立即切换到该组织 */
    async function createAndSwitch(form: CreateOrgForm) {
        const created = await createOrg(form);
        await fetchOrgs();
        currentOrgId.value = created.id;
        return created;
    }

    /** 搜索公开组织（供 OrgExplorePage 使用） */
    async function explore(keyword?: string) {
        return exploreOrgs({ keyword, limit: 20 });
    }

    /** 组织内搜索成员（供 OrgDetailPage 使用） */
    async function searchMembers(orgId: string, keyword: string) {
        return searchOrgMembers({ orgId, keyword });
    }

    return {
        orgs,
        currentOrgId,
        currentOrg,
        fetchOrgs,
        selectOrg,
        createAndSwitch,
        explore,
        searchMembers,
    };
});
