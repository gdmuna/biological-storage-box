import { GrantShareDto, RespondShareDto } from '../share.dto.js';
import { ShareRepository } from './share.repository.js';
import { ShareNotFoundException, ShareAlreadyExistsException } from '../share.exception.js';
import { OrgKernel } from '@/modules/org/org.kernel.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareService {
    constructor(
        private readonly shareRepository: ShareRepository,
        private readonly orgKernel: OrgKernel
    ) {}

    async grant(userId: string, dto: GrantShareDto) {
        await this.orgKernel.assertAdmin(dto.ownerOrgId, userId);
        const existing = await this.shareRepository.findDuplicate(
            dto.resourceId,
            dto.ownerOrgId,
            dto.granteeOrgId
        );
        if (existing) throw new ShareAlreadyExistsException();
        return this.shareRepository.create({
            resourceType: dto.resourceType,
            resourceId: dto.resourceId,
            ownerOrgId: dto.ownerOrgId,
            granteeOrgId: dto.granteeOrgId,
            permission: dto.permission,
            status: 'ACTIVE',
        });
    }

    async respond(userId: string, dto: RespondShareDto) {
        const share = await this.shareRepository.findById(dto.shareId);
        if (!share) throw new ShareNotFoundException();
        await this.orgKernel.assertAdmin(share.ownerOrgId, userId);
        return this.shareRepository.updateStatus(dto.shareId, dto.approve ? 'ACTIVE' : 'REVOKED');
    }

    async revoke(userId: string, shareId: string) {
        const share = await this.shareRepository.findById(shareId);
        if (!share) throw new ShareNotFoundException();
        await this.orgKernel.assertAdmin(share.ownerOrgId, userId);
        return this.shareRepository.updateStatus(shareId, 'REVOKED');
    }

    async listOutbound(orgId: string) {
        return this.shareRepository.listOutbound(orgId);
    }

    async listInbound(orgId: string) {
        return this.shareRepository.listInbound(orgId);
    }
}
