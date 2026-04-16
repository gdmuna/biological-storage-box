import { DatabaseService } from '@/infra/database/database.service.js';
import { NodeType } from '@root/prisma/generated/enums.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        orgId: string;
        parentId?: string;
        name: string;
        description?: string;
        type: NodeType;
        metadata?: Record<string, any>;
    }) {
        return this.db.node.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.node.findUnique({ where: { id }, include: { gridConfig: true } });
    }

    /**
     * 平铺查询整棵树后返回，前端负责构建树结构。
     * 适用于节点数量合理的场景（< 1000 节点）。
     */
    async loadTree(orgId: string) {
        return this.db.node.findMany({
            where: { orgId },
            include: {
                gridConfig: true,
                children: true,
                _count: {
                    select: {
                        children: true,
                        reagents: true,
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

    /**
     * 检查 candidateId 是否是 nodeId 的后代，防止循环引用。
     * 使用单条递归 CTE，无论树深度多少只执行一次数据库往返。
     */
    async isDescendant(nodeId: string, candidateId: string): Promise<boolean> {
        const rows = await this.db.$queryRaw<Array<{ exists: boolean }>>`
            WITH RECURSIVE ancestors AS (
                SELECT id, "parentId" FROM "Node" WHERE id = ${candidateId}
                UNION ALL
                SELECT n.id, n."parentId" FROM "Node" n
                INNER JOIN ancestors a ON n.id = a."parentId"
            )
            SELECT EXISTS (
                SELECT 1 FROM ancestors WHERE id = ${nodeId} AND id <> ${candidateId}
            ) AS exists
        `;
        return Boolean(rows[0]?.exists);
    }
}
