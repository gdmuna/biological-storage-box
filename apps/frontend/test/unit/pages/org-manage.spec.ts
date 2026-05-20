import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';

const listMembersSend = vi.fn();
const listPendingSend = vi.fn();

vi.mock('@/api/modules/org-user', () => ({
    listOrgMembers: vi.fn(() => ({ send: listMembersSend })),
    listPendingOrgUsers: vi.fn(() => ({ send: listPendingSend })),
    removeMember: vi.fn(),
    acceptApply: vi.fn(),
    rejectApply: vi.fn(),
    inviteUser: vi.fn(),
    updateMemberAuthority: vi.fn(),
    quitOrg: vi.fn(),
}));

vi.mock('@/api/modules/org', () => ({
    createOrg: vi.fn(),
    deleteOrg: vi.fn(),
}));

const orgStore = reactive({
    orgs: [],
    currentOrgId: 'org-1' as string | null,
    currentOrg: null,
    fetchOrgs: vi.fn(),
    selectOrg: vi.fn(),
});

vi.mock('@/stores/org', () => ({
    useOrgStore: () => orgStore,
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => ({
        user: { id: 'u1' },
    }),
}));

import OrgManagePage from '@/pages/org/OrgManagePage.vue';

describe('OrgManagePage', () => {
    beforeEach(() => {
        listMembersSend.mockReset();
        listPendingSend.mockReset();
        listMembersSend.mockResolvedValue([]);
        listPendingSend.mockResolvedValue([]);
        orgStore.currentOrgId = 'org-1';
    });

    it('reloads members and pending list when currentOrgId changes in members tab', async () => {
        const wrapper = shallowMount(OrgManagePage);

        const membersTab = wrapper.findAll('button').find((btn) => btn.text().includes('成员列表'));
        expect(membersTab).toBeTruthy();
        await membersTab!.trigger('click');
        await flushPromises();

        orgStore.currentOrgId = 'org-2';
        await wrapper.vm.$nextTick();
        await flushPromises();

        expect(listMembersSend).toHaveBeenCalledTimes(2);
        expect(listPendingSend).toHaveBeenCalledTimes(2);
    });
});
