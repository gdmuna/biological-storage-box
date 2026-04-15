import { alovaInstance } from '../client';
import type { Node, NodeWithChildren } from '@/schemas/node.schema';

/** Convenience alias used by stores and pages */
export type NodeItem = Node & { children?: NodeItem[] };

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
    type?: 'ROOM' | 'BOX' | 'CONTAINER';
    metadata?: Record<string, unknown>;
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

/** 设置网格配置 */
export const setGridConfig = (data: { nodeId: string; rows: number; cols: number }) =>
    alovaInstance.Post<{ nodeId: string; rows: number; cols: number }>('/node/grid/set', data);

/** 移除网格配置 */
export const removeGridConfig = (nodeId: string) =>
    alovaInstance.Delete<void>('/node/grid/remove', { nodeId });

/** 按条件筛选节点 */
export const filterNodes = (params: {
    orgId: string;
    type?: 'ROOM' | 'BOX' | 'CONTAINER';
    hasGrid?: boolean;
    parentId?: string | null;
}) => alovaInstance.Get<Node[]>('/node/filter', { params });
