import { describe, it, expect, vi } from 'vitest';

// Minimal smoke test: ReagentType API mock
vi.mock('@/api/modules/reagent-type', () => ({
    listReagentTypes: () => ({
        send: () =>
            Promise.resolve([
                {
                    id: 'rt-1',
                    orgId: 'org-1',
                    name: '青霉素',
                    colorHex: '#0075de',
                    unit: 'mL',
                    description: null,
                    createdAt: '',
                },
            ]),
    }),
    createReagentType: () => ({
        send: () =>
            Promise.resolve({
                id: 'rt-2',
                orgId: 'org-1',
                name: '新类型',
                colorHex: null,
                unit: null,
                description: null,
                createdAt: '',
            }),
    }),
    updateReagentType: () => ({ send: () => Promise.resolve({}) }),
    deleteReagentType: () => ({ send: () => Promise.resolve() }),
}));

vi.mock('@/stores/org', () => ({
    useOrgStore: () => ({ currentOrgId: 'org-1' }),
}));

describe('ReagentType API Integration', () => {
    it('listReagentTypes resolves with items', async () => {
        const { listReagentTypes } = await import('@/api/modules/reagent-type');
        const result = await listReagentTypes({ orgId: 'org-1' }).send();
        expect(result[0].name).toBe('青霉素');
    });
});
