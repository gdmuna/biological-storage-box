import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class RootRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: { orgId: string; name: string; description?: string }) {
        return this.db.root.create({ data });
    }

    async findById(id: string) {
        return this.db.root.findUnique({ where: { id } });
    }

    async listByOrgId(orgId: string) {
        return this.db.root.findMany({
            where: { orgId },
            include: { _count: { select: { boxes: true } } },
        });
    }

    async update(id: string, data: { name?: string; description?: string }) {
        return this.db.root.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.db.root.delete({ where: { id } });
    }
}
