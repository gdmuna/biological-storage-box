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
import { listBoxLogs, listReagentLogs, createFeedback } from '@/api/modules/feedback';

describe('feedback API module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls Get /box/log/list with params', () => {
        const params = { boxId: 'box-1', limit: 20, offset: 0 };
        listBoxLogs(params);
        expect(alovaInstance.Get).toHaveBeenCalledWith('/box/log/list', { params });
    });

    it('calls Get /box/log/reagent/list with params', () => {
        const params = { reagentId: 'r-1', limit: 20, offset: 0 };
        listReagentLogs(params);
        expect(alovaInstance.Get).toHaveBeenCalledWith('/box/log/reagent/list', { params });
    });

    it('calls Post /feedback/add', () => {
        const data = { content: '反馈内容' };
        createFeedback(data);
        expect(alovaInstance.Post).toHaveBeenCalledWith('/feedback/add', data);
    });
});
