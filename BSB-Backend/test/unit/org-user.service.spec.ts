import { OrgUserService } from '@/modules/org/org-user.service.js';
import { OrgRepository } from '@/modules/org/org.repository.js';
import {
    OrgNotFoundException,
    OrgNotAdminException,
    OrgNotOwnerException,
    OrgAlreadyMemberException,
    OrgAlreadyAppliedException,
    OwnerCannotQuitException,
    ApplicationNotFoundException,
} from '@/modules/org/org.exception.js';

const mockOrgRepository: jest.Mocked<
    Pick<
        OrgRepository,
        | 'findById'
        | 'findMembership'
        | 'createMembership'
        | 'updateMembership'
        | 'deleteMembership'
        | 'listPendingMembers'
        | 'listActiveMembers'
    >
> = {
    findById: jest.fn(),
    findMembership: jest.fn(),
    createMembership: jest.fn(),
    updateMembership: jest.fn(),
    deleteMembership: jest.fn(),
    listPendingMembers: jest.fn(),
    listActiveMembers: jest.fn(),
};

const mockOrg = {
    id: 'org_1',
    name: 'Test Org',
    ownerId: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
};
const mockActiveMembership = {
    id: 'mem_1',
    orgId: 'org_1',
    userId: 'user_2',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;
const mockPendingMembership = {
    id: 'mem_2',
    orgId: 'org_1',
    userId: 'user_2',
    role: 'MEMBER',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;
const mockOwnerMembership = {
    id: 'mem_3',
    orgId: 'org_1',
    userId: 'user_1',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

describe('OrgUserService', () => {
    let service: OrgUserService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OrgUserService(mockOrgRepository as unknown as OrgRepository);
    });

    describe('apply', () => {
        it('should create a new pending membership when applying fresh', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue(null);
            mockOrgRepository.createMembership.mockResolvedValue(mockPendingMembership);
            const result = await service.apply('user_2', 'org_1');
            expect(result.status).toBe('PENDING');
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            mockOrgRepository.findById.mockResolvedValue(null);
            await expect(service.apply('user_2', 'org_1')).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgAlreadyMemberException when already active', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue(mockActiveMembership);
            await expect(service.apply('user_2', 'org_1')).rejects.toThrow(
                OrgAlreadyMemberException
            );
        });

        it('should throw OrgAlreadyAppliedException when already pending', async () => {
            mockOrgRepository.findById.mockResolvedValue(mockOrg);
            mockOrgRepository.findMembership.mockResolvedValue(mockPendingMembership);
            await expect(service.apply('user_2', 'org_1')).rejects.toThrow(
                OrgAlreadyAppliedException
            );
        });
    });

    describe('acceptApplication', () => {
        it('should accept pending application when admin calls', async () => {
            mockOrgRepository.findMembership
                .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' } as any) // adminId check
                .mockResolvedValueOnce(mockPendingMembership); // targetUserId check
            mockOrgRepository.updateMembership.mockResolvedValue({
                ...mockPendingMembership,
                status: 'ACTIVE',
            });
            const result = await service.acceptApplication('admin_1', 'org_1', 'user_2');
            expect(result.status).toBe('ACTIVE');
        });

        it('should throw OrgNotAdminException when caller lacks permission', async () => {
            mockOrgRepository.findMembership.mockResolvedValue({
                role: 'MEMBER',
                status: 'ACTIVE',
            } as any);
            await expect(service.acceptApplication('user_3', 'org_1', 'user_2')).rejects.toThrow(
                OrgNotAdminException
            );
        });
    });

    describe('quit', () => {
        it('should remove member when quitting non-owner', async () => {
            mockOrgRepository.findMembership.mockResolvedValue(mockActiveMembership);
            mockOrgRepository.deleteMembership.mockResolvedValue(undefined as any);
            await expect(service.quit('user_2', 'org_1')).resolves.toBeUndefined();
        });

        it('should throw OwnerCannotQuitException when owner tries to quit', async () => {
            mockOrgRepository.findMembership.mockResolvedValue(mockOwnerMembership);
            await expect(service.quit('user_1', 'org_1')).rejects.toThrow(OwnerCannotQuitException);
        });

        it('should throw ApplicationNotFoundException when no membership', async () => {
            mockOrgRepository.findMembership.mockResolvedValue(null);
            await expect(service.quit('user_2', 'org_1')).rejects.toThrow(
                ApplicationNotFoundException
            );
        });
    });

    describe('updateAuthority', () => {
        it('should update member role when owner calls', async () => {
            mockOrgRepository.findMembership
                .mockResolvedValueOnce(mockOwnerMembership) // owner check
                .mockResolvedValueOnce(mockActiveMembership); // target check
            mockOrgRepository.updateMembership.mockResolvedValue({
                ...mockActiveMembership,
                role: 'ADMIN',
            });
            const result = await service.updateAuthority('user_1', 'org_1', 'user_2', 'ADMIN');
            expect(result.role).toBe('ADMIN');
        });

        it('should throw OrgNotOwnerException when non-owner tries', async () => {
            mockOrgRepository.findMembership.mockResolvedValue(mockActiveMembership); // role: MEMBER
            await expect(
                service.updateAuthority('user_2', 'org_1', 'user_3', 'ADMIN')
            ).rejects.toThrow(OrgNotOwnerException);
        });
    });

    describe('invite', () => {
        it('should create pending membership for invite', async () => {
            mockOrgRepository.findMembership
                .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' } as any) // admin check
                .mockResolvedValueOnce(null); // existing check
            mockOrgRepository.createMembership.mockResolvedValue(mockPendingMembership);
            const result = await service.invite('user_1', 'org_1', 'user_3');
            expect(result.status).toBe('PENDING');
        });
    });

    describe('acceptInvite', () => {
        it('should activate pending membership', async () => {
            mockOrgRepository.findMembership.mockResolvedValue(mockPendingMembership);
            mockOrgRepository.updateMembership.mockResolvedValue({
                ...mockPendingMembership,
                status: 'ACTIVE',
            });
            const result = await service.acceptInvite('user_2', 'org_1');
            expect(result.status).toBe('ACTIVE');
        });
    });
});
