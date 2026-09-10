import { CreateReagentTypeDto, UpdateReagentTypeDto } from '../reagent-type.dto.js';
import { ReagentTypeRepository } from './reagent-type.repository.js';
import {
    ReagentTypeNotFoundException,
    ReagentTypeNotAdminException,
} from '../reagent-type.exception.js';
import { OrgKernel } from '@/modules/org/org.kernel.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentTypeService {
    constructor(
        private readonly reagentTypeRepository: ReagentTypeRepository,
        private readonly orgKernel: OrgKernel
    ) {}

    private async assertOrgAdmin(orgId: string, userId: string) {
        if (!(await this.orgKernel.hasAdminRole(orgId, userId))) {
            throw new ReagentTypeNotAdminException();
        }
    }

    async create(userId: string, dto: CreateReagentTypeDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.reagentTypeRepository.create({
            orgId: dto.orgId,
            name: dto.name,
            description: dto.description,
            colorHex: dto.colorHex,
            unit: dto.unit,
        });
    }

    async list(orgId: string) {
        return this.reagentTypeRepository.listByOrgId(orgId);
    }

    async update(userId: string, dto: UpdateReagentTypeDto) {
        const reagentType = await this.reagentTypeRepository.findById(dto.id);
        if (!reagentType) throw new ReagentTypeNotFoundException();
        await this.assertOrgAdmin(reagentType.orgId, userId);
        return this.reagentTypeRepository.update(dto.id, {
            name: dto.name,
            description: dto.description,
            colorHex: dto.colorHex,
            unit: dto.unit,
        });
    }

    async delete(userId: string, id: string) {
        const reagentType = await this.reagentTypeRepository.findById(id);
        if (!reagentType) throw new ReagentTypeNotFoundException();
        await this.assertOrgAdmin(reagentType.orgId, userId);
        await this.reagentTypeRepository.delete(id);
    }
}
