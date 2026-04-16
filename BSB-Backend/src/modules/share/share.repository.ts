import { DatabaseService } from '@/infra/database/database.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        resourceType: string;
        resourceId: string;
        ownerOrgId: string;
        granteeOrgId: string;
        permission: string;
        status: string;
    }) {
        return this.db.resourceShare.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.resourceShare.findUnique({ where: { id } });
    }

    async findDuplicate(resourceId: string, ownerOrgId: string, granteeOrgId: string) {
        return this.db.resourceShare.findFirst({
            where: {
                resourceId,
                ownerOrgId,
                granteeOrgId,
                status: { not: 'REVOKED' },
            },
        });
    }

    async listOutbound(ownerOrgId: string) {
        return this.db.resourceShare.findMany({
            where: { ownerOrgId, status: { not: 'REVOKED' } },
            include: {
                granteeOrg: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async listInbound(granteeOrgId: string) {
        return this.db.resourceShare.findMany({
            where: { granteeOrgId, status: 'ACTIVE' },
            include: {
                ownerOrg: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.db.resourceShare.update({
            where: { id },
            data: { status } as any,
        });
    }
}
