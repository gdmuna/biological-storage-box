import { UpdateReagentDto } from './reagent.dto.js';
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
}
