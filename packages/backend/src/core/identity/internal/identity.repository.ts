import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

/** Local-account persistence owned by the identity kernel. */
@Injectable()
export class IdentityRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    findDuplicate(username: string, email: string) {
        return this.databaseService.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });
    }

    findByAccount(account: string) {
        return this.databaseService.user.findFirst({
            where: {
                OR: [
                    { username: { equals: account, mode: 'insensitive' } },
                    { email: { equals: account, mode: 'insensitive' } },
                ],
            },
        });
    }

    findById(id: string) {
        return this.databaseService.user.findUnique({ where: { id } });
    }

    createPasswordAccount(data: { username: string; email: string; passwordHash: string }) {
        return this.databaseService.user.create({ data });
    }
}
