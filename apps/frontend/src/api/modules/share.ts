import { alovaInstance } from '../client';

export interface ShareRecord {
    id: string;
    resourceType: string;
    resourceId: string;
    ownerOrgId: string;
    granteeOrgId: string;
    permission: string;
    status: string;
    createdAt: string;
    ownerOrg?: { id: string; name: string };
    granteeOrg?: { id: string; name: string };
}

export const grantShare = (data: {
    resourceType: string;
    resourceId: string;
    ownerOrgId: string;
    granteeOrgId: string;
    permission: 'READ' | 'WRITE';
}) => alovaInstance.Post<ShareRecord>('/share/grant', data);

export const respondShare = (data: { shareId: string; approve: boolean }) =>
    alovaInstance.Put<ShareRecord>('/share/respond', data);

export const revokeShare = (shareId: string) =>
    alovaInstance.Delete<void>('/share/revoke', { shareId });

export const listOutboundShares = (orgId: string) =>
    alovaInstance.Get<ShareRecord[]>('/share/outbound', { params: { orgId } });

export const listInboundShares = (orgId: string) =>
    alovaInstance.Get<ShareRecord[]>('/share/inbound', { params: { orgId } });
