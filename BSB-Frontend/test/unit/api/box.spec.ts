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
import {
    createBox,
    deleteBox,
    getBox,
    listBoxes,
    listBoxesGroupedByRoot,
    searchBoxes,
    updateBox,
    getReagent,
    listReagents,
    updateReagent,
    createBoxAlias,
    deleteBoxAlias,
    listBoxAliases,
    updateBoxAlias,
} from '@/api/modules/box';

describe('box API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Box CRUD ──────────────────────────────────────────────────────────

    describe('createBox', () => {
        it('calls Post /box/add with full payload', () => {
            const data = { orgId: 'org-1', name: 'Box A', rows: 9, cols: 9 };
            createBox(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/box/add', data);
        });

        it('calls Post /box/add with minimal payload', () => {
            const data = { orgId: 'org-1', name: 'Box B' };
            createBox(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/box/add', data);
        });
    });

    describe('deleteBox', () => {
        it('calls Delete /box/del with box id in data body', () => {
            deleteBox('box-42');
            expect(alovaInstance.Delete).toHaveBeenCalledWith('/box/del', {
                data: { id: 'box-42' },
            });
        });
    });

    describe('getBox', () => {
        it('calls Get /box/one with id as query param', () => {
            getBox('box-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/box/one', { params: { id: 'box-1' } });
        });
    });

    describe('listBoxes', () => {
        it('calls Get /box/list with orgId', () => {
            listBoxes('org-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/box/list', {
                params: { orgId: 'org-1' },
            });
        });
    });

    describe('listBoxesGroupedByRoot', () => {
        it('calls Get /box/root/list with orgId', () => {
            listBoxesGroupedByRoot('org-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/box/root/list', {
                params: { orgId: 'org-1' },
            });
        });
    });

    describe('searchBoxes', () => {
        it('calls Get /box/search with orgId and keyword', () => {
            const params = { orgId: 'org-1', keyword: 'cryo' };
            searchBoxes(params);
            expect(alovaInstance.Get).toHaveBeenCalledWith('/box/search', { params });
        });

        it('calls Get /box/search with optional limit', () => {
            const params = { orgId: 'org-1', keyword: 'cryo', limit: 10 };
            searchBoxes(params);
            expect(alovaInstance.Get).toHaveBeenCalledWith('/box/search', { params });
        });
    });

    describe('updateBox', () => {
        it('calls Put /box/update with update payload', () => {
            const data = { id: 'box-1', name: 'Updated Name' };
            updateBox(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/box/update', data);
        });

        it('passes null rootId to clear parent', () => {
            const data = { id: 'box-1', rootId: null };
            updateBox(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/box/update', data);
        });
    });

    // ── Reagent ───────────────────────────────────────────────────────────

    describe('getReagent', () => {
        it('calls Get /reagent/one with reagent id', () => {
            getReagent('reagent-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/reagent/one', {
                params: { id: 'reagent-1' },
            });
        });
    });

    describe('listReagents', () => {
        it('calls Get /reagent/list with boxId', () => {
            listReagents('box-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/reagent/list', {
                params: { boxId: 'box-1' },
            });
        });
    });

    describe('updateReagent', () => {
        it('calls Put /reagent/update with update payload', () => {
            const data = { id: 'reagent-1', name: 'Sample X', position: '1-1' };
            updateReagent(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/reagent/update', data);
        });
    });

    // ── Box Alias ─────────────────────────────────────────────────────────

    describe('createBoxAlias', () => {
        it('calls Post /box/alias/add with boxId and alias', () => {
            const data = { boxId: 'box-1', alias: 'CryoBox-A' };
            createBoxAlias(data);
            expect(alovaInstance.Post).toHaveBeenCalledWith('/box/alias/add', data);
        });
    });

    describe('deleteBoxAlias', () => {
        it('calls Delete /box/alias/del with alias id in data body', () => {
            deleteBoxAlias('alias-99');
            expect(alovaInstance.Delete).toHaveBeenCalledWith('/box/alias/del', {
                data: { id: 'alias-99' },
            });
        });
    });

    describe('listBoxAliases', () => {
        it('calls Get /box/alias/list with boxId', () => {
            listBoxAliases('box-1');
            expect(alovaInstance.Get).toHaveBeenCalledWith('/box/alias/list', {
                params: { boxId: 'box-1' },
            });
        });
    });

    describe('updateBoxAlias', () => {
        it('calls Put /box/alias/update with id and new alias', () => {
            const data = { id: 'alias-1', alias: 'NewAlias' };
            updateBoxAlias(data);
            expect(alovaInstance.Put).toHaveBeenCalledWith('/box/alias/update', data);
        });
    });
});
