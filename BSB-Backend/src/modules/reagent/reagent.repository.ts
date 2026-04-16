import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentRepository {
    constructor(private readonly db: DatabaseService) {}

    async findById(id: string) {
        return this.db.reagent.findUnique({
            where: { id },
        });
    }

    async listByNodeId(nodeId: string) {
        return this.db.reagent.findMany({
            where: { nodeId },
            orderBy: { position: 'asc' },
        });
    }

    async update(id: string, data: { position?: string; name?: string; description?: string }) {
        return this.db.reagent.update({ where: { id }, data });
    }

    async create(data: {
        nodeId: string;
        position: string;
        name: string;
        description?: string;
        reagentTypeId?: string;
    }) {
        const node = await this.db.node.findUnique({
            where: { id: data.nodeId },
            select: { orgId: true },
        });
        if (!node) return null;
        return this.db.reagent.create({
            data: {
                nodeId: data.nodeId,
                orgId: node.orgId,
                position: data.position,
                name: data.name,
                ...(data.description !== undefined && { description: data.description }),
                ...(data.reagentTypeId !== undefined && { reagentTypeId: data.reagentTypeId }),
            },
        });
    }
}
