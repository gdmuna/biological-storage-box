import { CreateNodeDto, UpdateNodeDto, AddNodeImageDto, RemoveNodeImageDto } from '../node.dto.js';
import { NodeRepository } from './node.repository.js';
import { NodeNotFoundException, NodeCircularReferenceException } from '../node.exception.js';

import { OrgKernel } from '@/modules/org/org.kernel.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeService {
    constructor(
        private readonly nodeRepository: NodeRepository,
        private readonly orgKernel: OrgKernel
    ) {}

    async create(userId: string, dto: CreateNodeDto) {
        await this.orgKernel.assertAdmin(dto.orgId, userId);
        return this.nodeRepository.create({
            orgId: dto.orgId,
            parentId: dto.parentId,
            name: dto.name,
            description: dto.description,
            type: dto.type,
            metadata: dto.metadata,
        });
    }

    async delete(userId: string, id: string) {
        const node = await this.nodeRepository.findById(id);
        if (!node) throw new NodeNotFoundException();
        await this.orgKernel.assertAdmin(node.orgId, userId);
        await this.nodeRepository.delete(id);
    }

    async getTree(orgId: string) {
        return this.nodeRepository.loadTree(orgId);
    }

    async getOne(id: string) {
        const node = await this.nodeRepository.findById(id);
        if (!node) throw new NodeNotFoundException();
        return node;
    }

    async update(userId: string, dto: UpdateNodeDto) {
        const node = await this.nodeRepository.findById(dto.id);
        if (!node) throw new NodeNotFoundException();
        await this.orgKernel.assertAdmin(node.orgId, userId);

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
            ...(dto.type !== undefined && { type: dto.type }),
            ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        });
    }

    async setGridConfig(userId: string, dto: { nodeId: string; rows: number; cols: number }) {
        const node = await this.nodeRepository.findById(dto.nodeId);
        if (!node) throw new NodeNotFoundException();
        await this.orgKernel.assertAdmin(node.orgId, userId);
        return this.nodeRepository.setGridConfig(dto.nodeId, dto.rows, dto.cols);
    }

    async removeGridConfig(userId: string, dto: { nodeId: string }) {
        const node = await this.nodeRepository.findById(dto.nodeId);
        if (!node) throw new NodeNotFoundException();
        await this.orgKernel.assertAdmin(node.orgId, userId);
        await this.nodeRepository.removeGridConfig(dto.nodeId);
    }

    async addImage(userId: string, dto: AddNodeImageDto) {
        const node = await this.nodeRepository.findById(dto.nodeId);
        if (!node) throw new NodeNotFoundException();
        await this.orgKernel.assertAdmin(node.orgId, userId);
        return this.nodeRepository.addImage(dto.nodeId, dto.imageUrl);
    }

    async removeImage(userId: string, dto: RemoveNodeImageDto) {
        const image = await this.nodeRepository.findImageById(dto.nodeImageId);
        if (!image) throw new NodeNotFoundException();
        await this.orgKernel.assertAdmin(image.node.orgId, userId);
        await this.nodeRepository.removeImage(dto.nodeImageId);
    }
}
