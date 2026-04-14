import {
    CreateBoxDto,
    UpdateBoxDto,
    BoxSearchDto,
    CreateBoxAliasDto,
    UpdateBoxAliasDto,
    CreateBoxImageDto,
    BoxImageCompareDto,
} from './box.dto.js';
import { BoxRepository } from './box.repository.js';
import { BoxNotFoundException } from './box.exception.js';

import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class BoxService {
    constructor(
        private readonly boxRepository: BoxRepository,
        private readonly orgRepository: OrgRepository
    ) {}

    private async assertOrgAdmin(orgId: string, userId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
    }

    // ── Box ─────────────────────────────────────────

    async create(userId: string, dto: CreateBoxDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.boxRepository.create({
            orgId: dto.orgId,
            rootId: dto.rootId,
            nodeId: dto.nodeId,
            name: dto.name,
            description: dto.description,
            rows: dto.rows,
            cols: dto.cols,
        });
    }

    async delete(userId: string, id: string) {
        const box = await this.boxRepository.findById(id);
        if (!box) throw new BoxNotFoundException();
        await this.assertOrgAdmin(box.orgId, userId);
        await this.boxRepository.delete(id);
    }

    async getOne(id: string) {
        const box = await this.boxRepository.findByIdWithDetail(id);
        if (!box) throw new BoxNotFoundException();
        return box;
    }

    async list(orgId: string) {
        return this.boxRepository.listByOrgId(orgId);
    }

    async listGroupedByRoot(orgId: string) {
        return this.boxRepository.listGroupedByRoot(orgId);
    }

    async search(dto: BoxSearchDto) {
        return this.boxRepository.search(dto.orgId, dto.keyword, dto.limit);
    }

    async update(userId: string, dto: UpdateBoxDto) {
        const box = await this.boxRepository.findById(dto.id);
        if (!box) throw new BoxNotFoundException();
        await this.assertOrgAdmin(box.orgId, userId);
        return this.boxRepository.update(dto.id, {
            ...(dto.rootId !== undefined && { rootId: dto.rootId }),
            ...(dto.nodeId !== undefined && { nodeId: dto.nodeId }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
        });
    }

    // ── BoxAlias ────────────────────────────────────

    async createAlias(userId: string, dto: CreateBoxAliasDto) {
        const box = await this.boxRepository.findById(dto.boxId);
        if (!box) throw new BoxNotFoundException();
        await this.assertOrgAdmin(box.orgId, userId);
        return this.boxRepository.createAlias({ boxId: dto.boxId, alias: dto.alias });
    }

    async listAliases(boxId: string) {
        return this.boxRepository.listAliases(boxId);
    }

    async updateAlias(userId: string, dto: UpdateBoxAliasDto) {
        const alias = await this.boxRepository.findAliasById(dto.id);
        if (!alias) throw new BoxNotFoundException();
        await this.assertOrgAdmin(alias.box.orgId, userId);
        return this.boxRepository.updateAlias(dto.id, dto.alias);
    }

    async deleteAlias(userId: string, id: string) {
        const alias = await this.boxRepository.findAliasById(id);
        if (!alias) throw new BoxNotFoundException();
        await this.assertOrgAdmin(alias.box.orgId, userId);
        await this.boxRepository.deleteAlias(id);
    }

    // ── BoxImage ────────────────────────────────────

    async createImage(userId: string, dto: CreateBoxImageDto) {
        const box = await this.boxRepository.findById(dto.boxId);
        if (!box) throw new BoxNotFoundException();
        await this.assertOrgAdmin(box.orgId, userId);
        return this.boxRepository.createImage({ boxId: dto.boxId, imageUrl: dto.imageUrl });
    }

    async listImages(boxId: string) {
        return this.boxRepository.listImages(boxId);
    }

    async compareImage(_dto: BoxImageCompareDto) {
        // TODO: 实现图片比对逻辑（调用 CV 服务）
        return { similar: true, confidence: 0.95 };
    }

    async deleteImage(userId: string, id: string) {
        const image = await this.boxRepository.findImageById(id);
        if (!image) throw new BoxNotFoundException();
        await this.assertOrgAdmin(image.box.orgId, userId);
        await this.boxRepository.deleteImage(id);
    }
}
