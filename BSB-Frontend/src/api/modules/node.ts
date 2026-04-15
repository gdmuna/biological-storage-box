import { alovaInstance } from '../client';
import type { Node, NodeWithChildren } from '@/schemas/node.schema';

/** 获取组织下指定父节点的直接子节点列表（parentId 为空时返回根节点） */
export const listNodes = (params: { orgId: string; parentId?: string }) =>
    alovaInstance.Get<Node[]>('/node/list', { params });

/** 获取组织完整节点树（4 层深度） */
export const getNodeTree = (orgId: string) =>
    alovaInstance.Get<NodeWithChildren[]>('/node/tree', { params: { orgId } });

/** 获取单个节点详情（含直接子节点） */
export const getNode = (id: string) =>
    alovaInstance.Get<NodeWithChildren>('/node/one', { params: { id } });

/** 创建节点 */
export const createNode = (data: {
    orgId: string;
    name: string;
    parentId?: string;
    description?: string;
}) => alovaInstance.Post<Node>('/node/add', data);

/** 更新节点 */
export const updateNode = (data: {
    id: string;
    name?: string;
    parentId?: string | null;
    description?: string;
}) => alovaInstance.Put<Node>('/node/update', data);

/** 删除节点 */
export const deleteNode = (id: string) => alovaInstance.Delete<void>('/node/del', { id });
