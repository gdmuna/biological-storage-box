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

    async list(boxId: string) {
        return this.reagentRepository.listByBoxId(boxId);
    }

    async update(dto: UpdateReagentDto) {
        const reagent = await this.reagentRepository.findById(dto.id);
        if (!reagent) throw new ReagentNotFoundException();
        return this.reagentRepository.update(dto.id, {
            ...(dto.position !== undefined && { position: dto.position }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
        });
    }

    async create(dto: CreateReagentDto) {
        const created = await this.reagentRepository.create({
            boxId: dto.boxId,
            position: dto.position,
            name: dto.name,
            description: dto.description,
            reagentTypeId: dto.reagentTypeId,
        });
        if (!created) throw new ReagentNotFoundException();
        return created;
    }
}
