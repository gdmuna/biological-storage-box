import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class OrgRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: { name: string; description?: string; ownerId: string }) {
        return this.db.$transaction(async (tx) => {
            const org = await tx.organization.create({ data });
            await tx.organizationUser.create({
                data: {
                    orgId: org.id,
                    userId: data.ownerId,
                    role: 'OWNER',
                    status: 'ACTIVE',
                },
            });
            return org;
        });
    }

    async findById(id: string) {
        return this.db.organization.findUnique({ where: { id } });
    }

    async findByIdWithOwner(id: string) {
        return this.db.organization.findUnique({
            where: { id },
            include: { owner: { select: { id: true, username: true, nickname: true } } },
        });
    }

    async listByUserId(userId: string) {
        return this.db.organization.findMany({
            where: { members: { some: { userId, status: 'ACTIVE' } } },
            include: { _count: { select: { members: { where: { status: 'ACTIVE' } } } } },
        });
    }

    async search(keyword: string, limit: number) {
        return this.db.organization.findMany({
            where: { name: { contains: keyword, mode: 'insensitive' } },
            take: limit,
            select: { id: true, name: true, description: true },
        });
    }

    async update(id: string, data: { name?: string; description?: string }) {
        return this.db.organization.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.db.organization.delete({ where: { id } });
    }

    // ── OrganizationUser queries ──────────────────────────

    async findMembership(orgId: string, userId: string) {
        return this.db.organizationUser.findUnique({
            where: { orgId_userId: { orgId, userId } },
        });
    }

    async createMembership(data: {
        orgId: string;
        userId: string;
        role?: 'OWNER' | 'ADMIN' | 'MEMBER';
        status?: 'PENDING' | 'ACTIVE' | 'REJECTED';
    }) {
        return this.db.organizationUser.create({
            data: {
                orgId: data.orgId,
                userId: data.userId,
                role: data.role ?? 'MEMBER',
                status: data.status ?? 'PENDING',
            },
        });
    }

    async updateMembership(
        id: string,
        data: { role?: 'OWNER' | 'ADMIN' | 'MEMBER'; status?: 'PENDING' | 'ACTIVE' | 'REJECTED' }
    ) {
        return this.db.organizationUser.update({ where: { id }, data });
    }

    async deleteMembership(orgId: string, userId: string) {
        return this.db.organizationUser.delete({
            where: { orgId_userId: { orgId, userId } },
        });
    }

    async listPendingMembers(orgId: string) {
        return this.db.organizationUser.findMany({
            where: { orgId, status: 'PENDING' },
            include: {
                user: { select: { id: true, username: true, nickname: true, email: true } },
            },
        });
    }

    async listActiveMembers(orgId: string) {
        return this.db.organizationUser.findMany({
            where: { orgId, status: 'ACTIVE' },
            include: {
                user: { select: { id: true, username: true, nickname: true, email: true } },
            },
        });
    }

    async findMembershipById(id: string) {
        return this.db.organizationUser.findUnique({ where: { id } });
    }
}
