import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class BoxRepository {
    constructor(private readonly db: DatabaseService) {}

    // ── Box CRUD ────────────────────────────────────

    async create(data: {
        orgId: string;
        rootId?: string;
        name: string;
        description?: string;
        rows: number;
        cols: number;
    }) {
        return this.db.box.create({ data });
    }

    async findById(id: string) {
        return this.db.box.findUnique({ where: { id } });
    }

    async findByIdWithDetail(id: string) {
        return this.db.box.findUnique({
            where: { id },
            include: {
                root: { select: { id: true, name: true } },
                aliases: true,
                _count: { select: { reagents: true, images: true } },
            },
        });
    }

    async listByOrgId(orgId: string) {
        return this.db.box.findMany({
            where: { orgId },
            include: {
                root: { select: { id: true, name: true } },
                _count: { select: { reagents: true } },
            },
        });
    }

    async listGroupedByRoot(orgId: string) {
        const roots = await this.db.root.findMany({
            where: { orgId },
            include: {
                boxes: {
                    include: { _count: { select: { reagents: true } } },
                },
            },
        });

        // Also include boxes not assigned to any root
        const unassigned = await this.db.box.findMany({
            where: { orgId, rootId: null },
            include: { _count: { select: { reagents: true } } },
        });

        const result: Array<{ rootId: string | null; rootName: string | null; boxes: unknown[] }> =
            roots.map((root) => ({
                rootId: root.id,
                rootName: root.name,
                boxes: root.boxes,
            }));

        if (unassigned.length > 0) {
            result.push({ rootId: null, rootName: null, boxes: unassigned });
        }

        return result;
    }

    async search(orgId: string, keyword: string, limit: number) {
        return this.db.box.findMany({
            where: {
                orgId,
                OR: [
                    { name: { contains: keyword, mode: 'insensitive' } },
                    { aliases: { some: { alias: { contains: keyword, mode: 'insensitive' } } } },
                ],
            },
            take: limit,
            include: { root: { select: { id: true, name: true } } },
        });
    }

    async update(
        id: string,
        data: { rootId?: string | null; name?: string; description?: string }
    ) {
        return this.db.box.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.db.box.delete({ where: { id } });
    }

    // ── BoxAlias CRUD ───────────────────────────────

    async createAlias(data: { boxId: string; alias: string }) {
        return this.db.boxAlias.create({ data });
    }

    async findAliasById(id: string) {
        return this.db.boxAlias.findUnique({
            where: { id },
            include: { box: { select: { orgId: true } } },
        });
    }

    async listAliases(boxId: string) {
        return this.db.boxAlias.findMany({ where: { boxId } });
    }

    async updateAlias(id: string, alias: string) {
        return this.db.boxAlias.update({ where: { id }, data: { alias } });
    }

    async deleteAlias(id: string) {
        return this.db.boxAlias.delete({ where: { id } });
    }

    // ── BoxImage CRUD ───────────────────────────────

    async createImage(data: { boxId: string; imageUrl: string }) {
        return this.db.boxImage.create({ data });
    }

    async findImageById(id: string) {
        return this.db.boxImage.findUnique({
            where: { id },
            include: { box: { select: { orgId: true } } },
        });
    }

    async listImages(boxId: string) {
        return this.db.boxImage.findMany({ where: { boxId }, orderBy: { createdAt: 'desc' } });
    }

    async deleteImage(id: string) {
        return this.db.boxImage.delete({ where: { id } });
    }
}
