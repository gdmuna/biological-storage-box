import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';

const listBoxesSend = vi.fn();

vi.mock('@/api/modules/box', () => ({
    listBoxes: vi.fn(() => ({ send: listBoxesSend })),
}));

const orgStore = reactive({
    currentOrgId: 'org-1' as string | null,
    orgs: [],
    currentOrg: null,
    fetchOrgs: vi.fn(),
    selectOrg: vi.fn(),
});

vi.mock('@/stores/org', () => ({
    useOrgStore: () => orgStore,
}));

vi.mock('@/utils/animation', () => ({
    fadeSlideIn: vi.fn(),
}));

import DashboardPage from '@/pages/dashboard/DashboardPage.vue';

describe('DashboardPage', () => {
    beforeEach(() => {
        listBoxesSend.mockReset();
        listBoxesSend.mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]);
        orgStore.currentOrgId = 'org-1';
    });

    it('refetches box count when org.currentOrgId changes', async () => {
        const wrapper = shallowMount(DashboardPage);
        await flushPromises();

        orgStore.currentOrgId = 'org-2';
        await wrapper.vm.$nextTick();
        await flushPromises();

        expect(listBoxesSend).toHaveBeenCalledTimes(2);
    });
});
