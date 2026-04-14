import { CreateRootDto, UpdateRootDto } from './root.dto.js';
import { RootRepository } from './root.repository.js';
import { RootNotFoundException } from './root.exception.js';

import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class RootService {
    constructor(
        private readonly rootRepository: RootRepository,
        private readonly orgRepository: OrgRepository
    ) {}

    /** 校验用户是否为组织的 OWNER 或 ADMIN */
    private async assertOrgAdmin(orgId: string, userId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
    }

    async create(userId: string, dto: CreateRootDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.rootRepository.create({
            orgId: dto.orgId,
            name: dto.name,
            description: dto.description,
        });
    }

    async delete(userId: string, id: string) {
        const root = await this.rootRepository.findById(id);
        if (!root) throw new RootNotFoundException();
        await this.assertOrgAdmin(root.orgId, userId);
        await this.rootRepository.delete(id);
    }

    async getOne(id: string) {
        const root = await this.rootRepository.findById(id);
        if (!root) throw new RootNotFoundException();
        return root;
    }

    async list(orgId: string) {
        return this.rootRepository.listByOrgId(orgId);
    }

    async update(userId: string, dto: UpdateRootDto) {
        const root = await this.rootRepository.findById(dto.id);
        if (!root) throw new RootNotFoundException();
        await this.assertOrgAdmin(root.orgId, userId);
        return this.rootRepository.update(dto.id, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
        });
    }
}
