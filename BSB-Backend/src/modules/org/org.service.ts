import { CreateOrgDto, UpdateOrgDto } from './org.dto.js';
import { OrgRepository } from './org.repository.js';
import {
    OrgNotFoundException,
    OrgNotOwnerException,
    OrgNotAdminException,
} from './org.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class OrgService {
    constructor(private readonly orgRepository: OrgRepository) {}

    async create(userId: string, dto: CreateOrgDto) {
        return this.orgRepository.create({
            name: dto.name,
            description: dto.description,
            ownerId: userId,
        });
    }

    async delete(userId: string, orgId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        if (org.ownerId !== userId) throw new OrgNotOwnerException();
        await this.orgRepository.delete(orgId);
    }

    async getOne(orgId: string) {
        const org = await this.orgRepository.findByIdWithOwner(orgId);
        if (!org) throw new OrgNotFoundException();
        return org;
    }

    async list(userId: string) {
        return this.orgRepository.listByUserId(userId);
    }

    async search(keyword: string, limit: number) {
        return this.orgRepository.search(keyword, limit);
    }

    async update(userId: string, dto: UpdateOrgDto) {
        const org = await this.orgRepository.findById(dto.orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(dto.orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
        return this.orgRepository.update(dto.orgId, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
        });
    }
}
