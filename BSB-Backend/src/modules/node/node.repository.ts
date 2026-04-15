import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        orgId: string;
        parentId?: string;
        name: string;
        description?: string;
        type?: string;
        metadata?: Record<string, unknown>;
    }) {
        return this.db.node.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.node.findUnique({ where: { id } });
    }

    async findByIdWithChildren(id: string) {
        return this.db.node.findUnique({
            where: { id },
            include: {
                children: { include: { _count: { select: { children: true, boxes: true } } } },
                _count: { select: { boxes: true } },
            },
        });
    }

    async listByOrgId(orgId: string, parentId?: string) {
        return this.db.node.findMany({
            where: {
                orgId,
                parentId: parentId ?? null,
            },
            include: { _count: { select: { children: true, boxes: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * 递归加载整棵树（深度优先）。
     * 适用于节点数量合理的场景（< 500 节点），否则应分批查询。
     */
    async loadTree(orgId: string) {
        return this.db.node.findMany({
            where: { orgId, parentId: null },
            include: {
                children: {
                    include: {
                        children: {
                            include: {
                                children: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(
        id: string,
        data: {
            parentId?: string | null;
            name?: string;
            description?: string;
            type?: string;
            metadata?: Record<string, unknown>;
        }
    ) {
        return this.db.node.update({ where: { id }, data: data as any });
    }

    async delete(id: string) {
        return this.db.node.delete({ where: { id } });
    }

    async setGridConfig(nodeId: string, rows: number, cols: number) {
        return this.db.nodeGridConfig.upsert({
            where: { nodeId },
            create: { nodeId, rows, cols },
            update: { rows, cols },
        });
    }

    async removeGridConfig(nodeId: string) {
        return this.db.nodeGridConfig.deleteMany({ where: { nodeId } });
    }

    async filter(
        orgId: string,
        opts: { type?: string; hasGrid?: boolean; parentId?: string | null }
    ) {
        return this.db.node.findMany({
            where: {
                orgId,
                ...(opts.type && { type: opts.type as any }),
                ...(opts.hasGrid === true && { gridConfig: { isNot: null } }),
                ...(opts.hasGrid === false && { gridConfig: null }),
                ...(opts.parentId !== undefined && { parentId: opts.parentId }),
            },
            include: {
                gridConfig: true,
                _count: { select: { children: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /** 检查 candidate 是否是 nodeId 的后代，用于防循环 */
    async isDescendant(nodeId: string, candidateId: string): Promise<boolean> {
        let current: { id: string; parentId: string | null } | null = await this.db.node.findUnique(
            {
                where: { id: candidateId },
                select: { id: true, parentId: true },
            }
        );

        while (current && current.parentId) {
            if (current.parentId === nodeId) return true;
            current = await this.db.node.findUnique({
                where: { id: current.parentId },
                select: { id: true, parentId: true },
            });
        }
        return false;
    }
}
