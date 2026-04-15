import { alovaInstance } from '../client';
import type { OrgMember, PendingOrgUser } from '@/schemas/org.schema';

/** 申请加入组织（当前登录用户） */
export const applyJoinOrg = (orgId: string) =>
    alovaInstance.Post<void>('/org/user/apply', { orgId });

/** 管理员接受申请 */
export const acceptApply = (data: { orgId: string; userId: string }) =>
    alovaInstance.Post<void>('/org/user/apply/ac', data);

/** 管理员拒绝申请 */
export const rejectApply = (data: { orgId: string; userId: string }) =>
    alovaInstance.Post<void>('/org/user/apply/ms', data);

/** 管理员移除成员 */
export const removeMember = (data: { orgId: string; userId: string }) =>
    alovaInstance.Delete<void>('/org/user/del', { data });

/** 管理员邀请用户 */
export const inviteUser = (data: { orgId: string; userId: string }) =>
    alovaInstance.Post<void>('/org/user/invite', data);

/** 当前用户接受邀请 */
export const acceptInvite = (orgId: string) =>
    alovaInstance.Post<void>('/org/user/invite/ac', { orgId });

/** 当前用户拒绝邀请 */
export const rejectInvite = (orgId: string) =>
    alovaInstance.Post<void>('/org/user/invite/ms', { orgId });

/** 获取组织待处理申请/邀请列表（管理员） */
export const listPendingOrgUsers = (orgId: string) =>
    alovaInstance.Get<PendingOrgUser[]>('/org/user/list', { params: { orgId } });

/** 获取组织成员列表 */
export const listOrgMembers = (orgId: string) =>
    alovaInstance.Get<OrgMember[]>('/org/user/member/list', { params: { orgId } });

/** 当前用户退出组织 */
export const quitOrg = (orgId: string) =>
    alovaInstance.Delete<void>('/org/user/quit', { data: { orgId } });

/** 修改成员权限（仅 owner 可调用） */
export const updateMemberAuthority = (data: {
    orgId: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
}) => alovaInstance.Put<void>('/org/user/updateAuthority', data);
