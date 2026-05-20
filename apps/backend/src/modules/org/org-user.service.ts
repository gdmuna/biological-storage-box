import { OrgRepository } from './org.repository.js';
import {
    OrgNotFoundException,
    OrgNotAdminException,
    OrgNotOwnerException,
    OrgAlreadyMemberException,
    OrgAlreadyAppliedException,
    OwnerCannotQuitException,
    CannotPromoteOwnerException,
    ApplicationNotFoundException,
} from './org.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class OrgUserService {
    constructor(private readonly orgRepository: OrgRepository) {}

    private async requireAdminOrOwner(orgId: string, userId: string) {
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
        return membership;
    }

    async apply(userId: string, orgId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        const existing = await this.orgRepository.findMembership(orgId, userId);
        if (existing && existing.status === 'ACTIVE') throw new OrgAlreadyMemberException();
        if (existing && existing.status === 'PENDING') throw new OrgAlreadyAppliedException();
        if (existing) {
            return this.orgRepository.updateMembership(existing.id, { status: 'PENDING' });
        }
        return this.orgRepository.createMembership({ orgId, userId, status: 'PENDING' });
    }

    async acceptApplication(adminId: string, orgId: string, targetUserId: string) {
        await this.requireAdminOrOwner(orgId, adminId);
        const membership = await this.orgRepository.findMembership(orgId, targetUserId);
        if (!membership || membership.status !== 'PENDING')
            throw new ApplicationNotFoundException();
        return this.orgRepository.updateMembership(membership.id, { status: 'ACTIVE' });
    }

    async rejectApplication(adminId: string, orgId: string, targetUserId: string) {
        await this.requireAdminOrOwner(orgId, adminId);
        const membership = await this.orgRepository.findMembership(orgId, targetUserId);
        if (!membership || membership.status !== 'PENDING')
            throw new ApplicationNotFoundException();
        return this.orgRepository.updateMembership(membership.id, { status: 'REJECTED' });
    }

    async removeMember(adminId: string, orgId: string, targetUserId: string) {
        await this.requireAdminOrOwner(orgId, adminId);
        await this.orgRepository.deleteMembership(orgId, targetUserId);
    }

    async invite(adminId: string, orgId: string, targetUserId: string) {
        await this.requireAdminOrOwner(orgId, adminId);
        const existing = await this.orgRepository.findMembership(orgId, targetUserId);
        if (existing && existing.status === 'ACTIVE') throw new OrgAlreadyMemberException();
        if (existing) {
            return this.orgRepository.updateMembership(existing.id, { status: 'PENDING' });
        }
        return this.orgRepository.createMembership({
            orgId,
            userId: targetUserId,
            status: 'PENDING',
        });
    }

    async acceptInvite(userId: string, orgId: string) {
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || membership.status !== 'PENDING')
            throw new ApplicationNotFoundException();
        return this.orgRepository.updateMembership(membership.id, { status: 'ACTIVE' });
    }

    async rejectInvite(userId: string, orgId: string) {
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || membership.status !== 'PENDING')
            throw new ApplicationNotFoundException();
        return this.orgRepository.updateMembership(membership.id, { status: 'REJECTED' });
    }

    async listPending(orgId: string) {
        return this.orgRepository.listPendingMembers(orgId);
    }

    async listMembers(orgId: string) {
        return this.orgRepository.listActiveMembers(orgId);
    }

    async quit(userId: string, orgId: string) {
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership) throw new ApplicationNotFoundException();
        if (membership.role === 'OWNER') throw new OwnerCannotQuitException();
        await this.orgRepository.deleteMembership(orgId, userId);
    }

    async updateAuthority(
        ownerId: string,
        orgId: string,
        targetUserId: string,
        role: 'ADMIN' | 'MEMBER'
    ) {
        const ownerMembership = await this.orgRepository.findMembership(orgId, ownerId);
        if (!ownerMembership || ownerMembership.role !== 'OWNER') throw new OrgNotOwnerException();
        if (role === ('OWNER' as string)) throw new CannotPromoteOwnerException();
        const targetMembership = await this.orgRepository.findMembership(orgId, targetUserId);
        if (!targetMembership) throw new ApplicationNotFoundException();
        return this.orgRepository.updateMembership(targetMembership.id, { role });
    }
}
