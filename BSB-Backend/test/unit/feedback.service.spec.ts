import { FeedbackService } from '@/modules/feedback/feedback.service.js';
import { FeedbackRepository } from '@/modules/feedback/feedback.repository.js';

const mockFeedbackRepository: jest.Mocked<
    Pick<FeedbackRepository, 'listBoxLogs' | 'listReagentLogs' | 'createFeedback'>
> = {
    listBoxLogs: jest.fn(),
    listReagentLogs: jest.fn(),
    createFeedback: jest.fn(),
};

const mockBoxLog = {
    id: 'log_1',
    boxId: 'box_1',
    action: 'CREATE',
    userId: 'user_1',
    createdAt: new Date(),
};
const mockReagentLog = {
    id: 'rlog_1',
    reagentId: 'reagent_1',
    action: 'UPDATE',
    userId: 'user_1',
    createdAt: new Date(),
};
const mockFeedback = {
    id: 'fb_1',
    userId: 'user_1',
    content: 'Great system!',
    createdAt: new Date(),
};

describe('FeedbackService', () => {
    let service: FeedbackService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new FeedbackService(mockFeedbackRepository as unknown as FeedbackRepository);
    });

    describe('listBoxLogs', () => {
        it('should return paginated box logs', async () => {
            mockFeedbackRepository.listBoxLogs.mockResolvedValue([mockBoxLog] as any);
            const result = await service.listBoxLogs('box_1', 10, 0);
            expect(result).toEqual([mockBoxLog]);
            expect(mockFeedbackRepository.listBoxLogs).toHaveBeenCalledWith('box_1', 10, 0);
        });
    });

    describe('listReagentLogs', () => {
        it('should return paginated reagent logs', async () => {
            mockFeedbackRepository.listReagentLogs.mockResolvedValue([mockReagentLog] as any);
            const result = await service.listReagentLogs('reagent_1', 10, 0);
            expect(result).toEqual([mockReagentLog]);
            expect(mockFeedbackRepository.listReagentLogs).toHaveBeenCalledWith('reagent_1', 10, 0);
        });
    });

    describe('createFeedback', () => {
        it('should create feedback with userId and content', async () => {
            mockFeedbackRepository.createFeedback.mockResolvedValue(mockFeedback as any);
            const result = await service.createFeedback('user_1', 'Great system!');
            expect(result).toEqual(mockFeedback);
            expect(mockFeedbackRepository.createFeedback).toHaveBeenCalledWith({
                userId: 'user_1',
                content: 'Great system!',
            });
        });
    });
});
