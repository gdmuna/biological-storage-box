import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentRepository {
    constructor(private readonly db: DatabaseService) {}

    async findById(id: string) {
        return this.db.reagent.findUnique({
            where: { id },
            include: { box: { select: { orgId: true } } },
        });
    }

    async listByBoxId(boxId: string) {
        return this.db.reagent.findMany({
            where: { boxId },
            orderBy: { position: 'asc' },
        });
    }

    async update(id: string, data: { position?: string; name?: string; description?: string }) {
        return this.db.reagent.update({ where: { id }, data });
    }

    async create(data: {
        boxId: string;
        position: string;
        name: string;
        description?: string;
        reagentTypeId?: string;
    }) {
        const box = await this.db.box.findUnique({
            where: { id: data.boxId },
            select: { orgId: true },
        });
        if (!box) return null;
        return this.db.reagent.create({
            data: {
                boxId: data.boxId,
                orgId: box.orgId,
                position: data.position,
                name: data.name,
                ...(data.description !== undefined && { description: data.description }),
                ...(data.reagentTypeId !== undefined && { reagentTypeId: data.reagentTypeId }),
            },
        });
    }
}
