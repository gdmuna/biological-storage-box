import { CreateNodeDto, UpdateNodeDto } from './node.dto.js';
import { NodeRepository } from './node.repository.js';
import { NodeNotFoundException, NodeCircularReferenceException } from './node.exception.js';

import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeService {
    constructor(
        private readonly nodeRepository: NodeRepository,
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

    async create(userId: string, dto: CreateNodeDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.nodeRepository.create({
            orgId: dto.orgId,
            parentId: dto.parentId,
            name: dto.name,
            description: dto.description,
        });
    }

    async delete(userId: string, id: string) {
        const node = await this.nodeRepository.findById(id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);
        await this.nodeRepository.delete(id);
    }

    async getOne(id: string) {
        const node = await this.nodeRepository.findByIdWithChildren(id);
        if (!node) throw new NodeNotFoundException();
        return node;
    }

    async list(orgId: string, parentId?: string) {
        return this.nodeRepository.listByOrgId(orgId, parentId);
    }

    async getTree(orgId: string) {
        return this.nodeRepository.loadTree(orgId);
    }

    async update(userId: string, dto: UpdateNodeDto) {
        const node = await this.nodeRepository.findById(dto.id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);

        // 防止循环引用：不能将节点移到自身或其后代
        if (dto.parentId && dto.parentId !== node.parentId) {
            if (dto.parentId === dto.id) throw new NodeCircularReferenceException();
            const circular = await this.nodeRepository.isDescendant(dto.id, dto.parentId);
            if (circular) throw new NodeCircularReferenceException();
        }

        return this.nodeRepository.update(dto.id, {
            ...(dto.parentId !== undefined && { parentId: dto.parentId }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
        });
    }
}
