import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailVerificationRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(email: string, code: string, expiresAt: Date) {
        return this.db.emailVerification.create({
            data: { email, code, expiresAt },
        });
    }

    async findLatestByEmail(email: string) {
        return this.db.emailVerification.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteByEmail(email: string) {
        return this.db.emailVerification.deleteMany({ where: { email } });
    }
}
