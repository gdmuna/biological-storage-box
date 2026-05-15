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

    async list(orgId?: string, nodeId?: string) {
        return this.db.reagent.findMany({
            where: { orgId, nodeId },
            include: { reagentType: true },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async update(
        id: string,
        data: {
            position?: string;
            name?: string;
            description?: string;
            reagentTypeId?: string | null;
            quantity?: number | null;
            unit?: string | null;
            expiryDate?: Date | null;
            manufactureDate?: Date | null;
            batchNo?: string | null;
            catalogNo?: string | null;
            manufacturer?: string | null;
            casNumber?: string | null;
            storageCondition?: Record<string, unknown> | null;
            hazardLevel?: string | null;
            minStockThreshold?: number | null;
        }
    ) {
        return this.db.reagent.update({
            where: { id },
            data: data as any,
        });
    }

    async create(data: {
        nodeId: string;
        position: string;
        name: string;
        description?: string;
        reagentTypeId?: string | null;
        quantity?: number;
        unit?: string;
        expiryDate?: Date;
        manufactureDate?: Date;
        batchNo?: string;
        catalogNo?: string;
        manufacturer?: string;
        casNumber?: string;
        storageCondition?: Record<string, unknown>;
        hazardLevel?: string;
        minStockThreshold?: number;
    }) {
        const node = await this.db.node.findUnique({
            where: { id: data.nodeId },
            select: { orgId: true },
        });
        if (!node) return null;
        return this.db.reagent.create({
            data: { ...data, orgId: node.orgId } as any,
        });
    }

    async delete(ids: string[]) {
        return this.db.reagent.deleteMany({ where: { id: { in: ids } } });
    }
}
