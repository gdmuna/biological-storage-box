import { OrgRepository } from './internal/org.repository.js';
import { OrgNotAdminException, OrgNotFoundException } from './org.exception.js';

import { Injectable } from '@nestjs/common';

/**
 * Organization facts exposed to other business modules.
 *
 * The repository remains an implementation detail of the organization module;
 * callers ask for an authorization fact instead of querying its tables.
 */
@Injectable()
export class OrgKernel {
    constructor(private readonly orgRepository: OrgRepository) {}

    async assertAdmin(orgId: string, userId: string): Promise<void> {
        if (!(await this.hasAdminRole(orgId, userId))) {
            throw new OrgNotAdminException();
        }
    }

    async hasAdminRole(orgId: string, userId: string): Promise<boolean> {
        await this.requireOrganization(orgId);
        const membership = await this.orgRepository.findMembership(orgId, userId);
        return membership?.role === 'OWNER' || membership?.role === 'ADMIN';
    }

    private async requireOrganization(orgId: string): Promise<void> {
        const organization = await this.orgRepository.findById(orgId);
        if (!organization) {
            throw new OrgNotFoundException();
        }
    }
}
