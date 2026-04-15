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
    createBoxImage,
    listBoxImages,
    compareBoxImage,
    deleteBoxImage,
} from '@/api/modules/box-image';

describe('box-image API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls Post /box/image/add', () => {
        const data = { boxId: 'box-1', imageUrl: 'https://example.com/a.png' };
        createBoxImage(data);
        expect(alovaInstance.Post).toHaveBeenCalledWith('/box/image/add', data);
    });

    it('calls Get /box/image/list', () => {
        listBoxImages('box-1');
        expect(alovaInstance.Get).toHaveBeenCalledWith('/box/image/list', {
            params: { boxId: 'box-1' },
        });
    });

    it('calls Post /box/image/compare', () => {
        const data = { boxId: 'box-1', imageUrl: 'https://example.com/a.png' };
        compareBoxImage(data);
        expect(alovaInstance.Post).toHaveBeenCalledWith('/box/image/compare', data);
    });

    it('calls Delete /box/image/del', () => {
        deleteBoxImage('img-1');
        expect(alovaInstance.Delete).toHaveBeenCalledWith('/box/image/del', { id: 'img-1' });
    });
});
