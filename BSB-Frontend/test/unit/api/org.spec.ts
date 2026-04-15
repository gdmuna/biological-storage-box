import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
    alovaInstance: {
        Get: vi.fn(),
        Post: vi.fn(),
        Put: vi.fn(),
        Delete: vi.fn(),
    },
}));

import { alovaInstance } from '@/api/client';
import { createOrg, deleteOrg, getOrg, listOrgs, searchOrgs, updateOrg } from '@/api/modules/org';

describe('org API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createOrg', () => {
        it('calls Post /org/create with name', () => {
            const data = { name: 'Lab A' };
            createOrg(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/org/create', data);
        });

        it('calls Post /org/create with name and description', () => {
            const data = { name: 'Lab B', description: 'Biochemistry lab' };
            createOrg(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/org/create', data);
        });
    });

    describe('deleteOrg', () => {
        it('calls Delete /org/del with orgId in data body', () => {
            deleteOrg('org-1');
            expect(alovaInstance.Delete).toHaveBeenCalledWith('/org/del', { orgId: 'org-1' });
        });
    });

    describe('getOrg', () => {
        it('calls Get /org/one with orgId param', () => {
            getOrg('org-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/org/one', {
                params: { orgId: 'org-1' },
            });
        });
    });

    describe('listOrgs', () => {
        it('calls Get /org/list with no parameters', () => {
            listOrgs();
            expect(alovaInstance.Get).toHaveBeenCalledWith('/org/list');
        });
    });

    describe('searchOrgs', () => {
        it('calls Get /org/search with keyword', () => {
            const params = { keyword: 'bio' };
            searchOrgs(params);
            expect(alovaInstance.Get).toHaveBeenCalledWith('/org/search', { params });
        });

        it('calls Get /org/search with keyword and limit', () => {
            const params = { keyword: 'chem', limit: 5 };
            searchOrgs(params);
            expect(alovaInstance.Get).toHaveBeenCalledWith('/org/search', { params });
        });
    });

    describe('updateOrg', () => {
        it('calls Put /org/update with orgId and new name', () => {
            const data = { orgId: 'org-1', name: 'Updated Lab' };
            updateOrg(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/org/update', data);
        });

        it('calls Put /org/update with description only', () => {
            const data = { orgId: 'org-1', description: 'New description' };
            updateOrg(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/org/update', data);
        });
    });
});
