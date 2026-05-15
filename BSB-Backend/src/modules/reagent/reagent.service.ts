import { UpdateReagentDto, CreateReagentDto } from './reagent.dto.js';
import { ReagentRepository } from './reagent.repository.js';
import { ReagentNotFoundException } from './reagent.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentService {
    constructor(private readonly reagentRepository: ReagentRepository) {}

    async getOne(id: string) {
        const reagent = await this.reagentRepository.findById(id);
        if (!reagent) throw new ReagentNotFoundException();
        return reagent;
    }

    async list(orgId?: string, nodeId?: string) {
        return this.reagentRepository.list(orgId, nodeId);
    }

    async update(dto: UpdateReagentDto) {
        const reagent = await this.reagentRepository.findById(dto.id);
        if (!reagent) throw new ReagentNotFoundException();
        return this.reagentRepository.update(dto.id, {
            ...(dto.position !== undefined && { position: dto.position }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.reagentTypeId !== undefined && { reagentTypeId: dto.reagentTypeId }),
            ...(dto.quantity !== undefined && { quantity: dto.quantity }),
            ...(dto.unit !== undefined && { unit: dto.unit }),
            ...(dto.expiryDate !== undefined && {
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            }),
            ...(dto.manufactureDate !== undefined && {
                manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : null,
            }),
            ...(dto.batchNo !== undefined && { batchNo: dto.batchNo }),
            ...(dto.catalogNo !== undefined && { catalogNo: dto.catalogNo }),
            ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
            ...(dto.casNumber !== undefined && { casNumber: dto.casNumber }),
            ...(dto.storageCondition !== undefined && { storageCondition: dto.storageCondition }),
            ...(dto.hazardLevel !== undefined && { hazardLevel: dto.hazardLevel }),
            ...(dto.minStockThreshold !== undefined && {
                minStockThreshold: dto.minStockThreshold,
            }),
        });
    }

    async create(dto: CreateReagentDto) {
        const created = await this.reagentRepository.create({
            nodeId: dto.nodeId,
            position: dto.position,
            name: dto.name,
            description: dto.description,
            reagentTypeId: dto.reagentTypeId,
            ...(dto.quantity !== undefined && { quantity: dto.quantity }),
            ...(dto.unit !== undefined && { unit: dto.unit }),
            ...(dto.expiryDate !== undefined && { expiryDate: new Date(dto.expiryDate) }),
            ...(dto.manufactureDate !== undefined && {
                manufactureDate: new Date(dto.manufactureDate),
            }),
            ...(dto.batchNo !== undefined && { batchNo: dto.batchNo }),
            ...(dto.catalogNo !== undefined && { catalogNo: dto.catalogNo }),
            ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
            ...(dto.casNumber !== undefined && { casNumber: dto.casNumber }),
            ...(dto.storageCondition !== undefined && { storageCondition: dto.storageCondition }),
            ...(dto.hazardLevel !== undefined && { hazardLevel: dto.hazardLevel }),
            ...(dto.minStockThreshold !== undefined && {
                minStockThreshold: dto.minStockThreshold,
            }),
        });
        if (!created) throw new ReagentNotFoundException();
        return created;
    }

    async delete(ids: string[]) {
        return await this.reagentRepository.delete(ids);
    }
}
