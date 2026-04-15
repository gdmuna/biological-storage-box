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
import { listRoots, getRoot, createRoot, updateRoot, deleteRoot } from '@/api/modules/root';

describe('root API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls Get /root/list', () => {
        listRoots('org-1');
        expect(alovaInstance.Get).toHaveBeenCalledWith('/root/list', {
            params: { orgId: 'org-1' },
        });
    });

    it('calls Get /root/one', () => {
        getRoot('root-1');
        expect(alovaInstance.Get).toHaveBeenCalledWith('/root/one', { params: { id: 'root-1' } });
    });

    it('calls Post /root/add', () => {
        const data = { orgId: 'org-1', name: '冷冻室A' };
        createRoot(data);
        expect(alovaInstance.Post).toHaveBeenCalledWith('/root/add', data);
    });

    it('calls Put /root/update', () => {
        const data = { id: 'root-1', name: '冷冻室B' };
        updateRoot(data);
        expect(alovaInstance.Put).toHaveBeenCalledWith('/root/update', data);
    });

    it('calls Delete /root/del', () => {
        deleteRoot('root-1');
        expect(alovaInstance.Delete).toHaveBeenCalledWith('/root/del', { id: 'root-1' });
    });
});
