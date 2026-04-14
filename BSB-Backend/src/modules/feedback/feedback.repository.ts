import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedbackRepository {
    constructor(private readonly db: DatabaseService) {}

    // ── BoxLog ──────────────────────────────────────

    async listBoxLogs(boxId: string, limit: number, offset: number) {
        const [items, total] = await Promise.all([
            this.db.boxLog.findMany({
                where: { boxId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    user: { select: { id: true, username: true, nickname: true } },
                    reagent: { select: { id: true, name: true, position: true } },
                },
            }),
            this.db.boxLog.count({ where: { boxId } }),
        ]);
        return { items, total, limit, offset };
    }

    async listReagentLogs(reagentId: string, limit: number, offset: number) {
        const [items, total] = await Promise.all([
            this.db.boxLog.findMany({
                where: { reagentId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    user: { select: { id: true, username: true, nickname: true } },
                    box: { select: { id: true, name: true } },
                },
            }),
            this.db.boxLog.count({ where: { reagentId } }),
        ]);
        return { items, total, limit, offset };
    }

    // ── Feedback ────────────────────────────────────

    async createFeedback(data: { userId: string; content: string }) {
        return this.db.feedback.create({ data });
    }
}
