import { FeedbackRepository } from './feedback.repository.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedbackService {
    constructor(private readonly feedbackRepository: FeedbackRepository) {}

    // ── BoxLog ──────────────────────────────────────

    async listBoxLogs(boxId: string, limit: number, offset: number) {
        return this.feedbackRepository.listBoxLogs(boxId, limit, offset);
    }

    async listReagentLogs(reagentId: string, limit: number, offset: number) {
        return this.feedbackRepository.listReagentLogs(reagentId, limit, offset);
    }

    // ── Feedback ────────────────────────────────────

    async createFeedback(userId: string, content: string) {
        return this.feedbackRepository.createFeedback({ userId, content });
    }
}
