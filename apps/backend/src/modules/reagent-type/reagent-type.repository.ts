import { DatabaseService } from '@/infra/database/database.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentTypeRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        orgId: string;
        name: string;
        description?: string;
        colorHex?: string;
        unit?: string;
    }) {
        return this.db.reagentType.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.reagentType.findUnique({ where: { id } });
    }

    async listByOrgId(orgId: string) {
        return this.db.reagentType.findMany({
            where: { orgId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(
        id: string,
        data: { name?: string; description?: string; colorHex?: string; unit?: string }
    ) {
        return this.db.reagentType.update({ where: { id }, data: data as any });
    }

    async delete(id: string) {
        return this.db.reagentType.delete({ where: { id } });
    }
}
