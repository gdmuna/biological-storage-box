<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';
import { Controls } from '@vue-flow/controls';
import { Background } from '@vue-flow/background';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNodeTree, getNode } from '@/api/modules/node';
import type { NodeWithChildren } from '@/schemas/node.schema';
import type { Node as FlowNode, Edge } from '@vue-flow/core';

interface Props {
    orgId: string;
    height?: string;
    compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    height: 'calc(100vh - 48px)',
    compact: false
});

const router = useRouter();
const { fitView } = useVueFlow();

const treeNodes = ref<NodeWithChildren[]>([]);
const loading = ref(false);

// Filters
const filterType = ref('all');
const filterGrid = ref('all');

// Drawer state
const drawerOpen = ref(false);
const selectedNode = ref<NodeWithChildren | null>(null);
const selectedNodeDetail = ref<NodeWithChildren | null>(null);

const typeColorMap: Record<string, string> = {
    ROOM: '#213183',
    BOX: '#0075de',
    CONTAINER: '#2a9d99'
};

const typeBgMap: Record<string, string> = {
    ROOM: '#f0f2ff',
    BOX: '#f2f9ff',
    CONTAINER: '#f0fafa'
};

function flattenTree(nodes: NodeWithChildren[], parentId: string | null = null, depth = 0): { flowNodes: FlowNode[]; edges: Edge[] } {
    const flowNodes: FlowNode[] = [];
    const edges: Edge[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const x = depth * 280;
        const y = flowNodes.length * 80 + i * 10;

        flowNodes.push({
            id: node.id,
            position: { x, y },
            data: { ...node },
            type: 'default',
            style: {
                background: typeBgMap[node.type] ?? '#fff',
                border: `1.5px solid ${typeColorMap[node.type] ?? '#ccc'}`,
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '510',
                color: typeColorMap[node.type] ?? '#333',
                minWidth: '140px'
            },
            label: node.name
        });

        if (parentId) {
            edges.push({
                id: `e-${parentId}-${node.id}`,
                source: parentId,
                target: node.id,
                animated: false,
                style: { stroke: '#d1d5db', strokeWidth: 1.5 }
            });
        }

        if (node.children?.length) {
            const child = flattenTree(node.children, node.id, depth + 1);
            flowNodes.push(...child.flowNodes);
            edges.push(...child.edges);
        }
    }

    return { flowNodes, edges };
}

const filteredTree = computed(() => {
    function filterRecursive(nodes: NodeWithChildren[]): NodeWithChildren[] {
        return nodes
            .filter((n) => {
                if (filterType.value !== 'all' && n.type !== filterType.value) {
                    // Keep if has matching children
                    const hasMatchingChild = n.children?.some((c) => c.type === filterType.value || filterRecursive(c.children ?? []).length > 0);
                    if (!hasMatchingChild) return false;
                }
                if (filterGrid.value === 'yes' && !n.gridConfig) return false;
                if (filterGrid.value === 'no' && n.gridConfig) return false;
                return true;
            })
            .map((n) => ({
                ...n,
                children: n.children ? filterRecursive(n.children) : []
            }));
    }

    if (filterType.value === 'all' && filterGrid.value === 'all') return treeNodes.value;
    return filterRecursive(treeNodes.value);
});

const flowData = computed(() => flattenTree(filteredTree.value));

const vfNodes = computed(() => flowData.value.flowNodes);
const vfEdges = computed(() => flowData.value.edges);

async function fetchTree() {
    if (!props.orgId) return;
    loading.value = true;
    try {
        treeNodes.value = await getNodeTree(props.orgId).send();
        setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch {
        /* empty */
    } finally {
        loading.value = false;
    }
}

async function onNodeClick({ node }: { node: FlowNode }) {
    selectedNode.value = node.data as NodeWithChildren;
    drawerOpen.value = true;
    try {
        selectedNodeDetail.value = await getNode((node.data as NodeWithChildren).id).send();
    } catch {
        selectedNodeDetail.value = null;
    }
}

onMounted(fetchTree);
watch(() => props.orgId, fetchTree);
</script>

<template>
    <div class="flex flex-col overflow-hidden" :style="{ height: height }">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-2 border-b border-bsb-border-standard bg-white px-4 py-2 overflow-x-auto">
            <!-- Legend -->
            <div class="flex items-center gap-3 text-[11px] text-bsb-text-tertiary">
                <span class="flex items-center gap-1">
                    <span class="inline-block size-2.5 rounded-full" style="background: #213183" />
                    ROOM
                </span>
                <span class="flex items-center gap-1">
                    <span class="inline-block size-2.5 rounded-full" style="background: #0075de" />
                    BOX
                </span>
                <span class="flex items-center gap-1">
                    <span class="inline-block size-2.5 rounded-full" style="background: #2a9d99" />
                    CONTAINER
                </span>
            </div>

            <span class="text-xs text-bsb-text-quaternary">{{ vfNodes.length }} 个节点</span>

            <template v-if="!compact">
                <Select v-model="filterType">
                    <SelectTrigger class="h-7 w-32 border-bsb-border-standard text-xs">
                        <SelectValue placeholder="类型筛选" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="ROOM">ROOM</SelectItem>
                        <SelectItem value="BOX">BOX</SelectItem>
                        <SelectItem value="CONTAINER">CONTAINER</SelectItem>
                    </SelectContent>
                </Select>

                <Select v-model="filterGrid">
                    <SelectTrigger class="h-7 w-32 border-bsb-border-standard text-xs">
                        <SelectValue placeholder="网格筛选" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="yes">有网格配置</SelectItem>
                        <SelectItem value="no">无网格配置</SelectItem>
                    </SelectContent>
                </Select>
            </template>
        </div>

        <!-- Canvas -->
        <div class="relative flex-1 bg-bsb-bg-secondary">
            <p v-if="loading" class="p-4 text-sm text-bsb-text-secondary">加载中…</p>
            <VueFlow v-else :nodes="vfNodes" :edges="vfEdges" :default-viewport="{ zoom: 0.85, x: 40, y: 40 }" :min-zoom="0.2" :max-zoom="2" fit-view-on-init @node-click="onNodeClick">
                <Background pattern-color="#e5e7eb" :gap="20" />
                <Controls v-if="!compact" />
                <MiniMap v-if="!compact" />
            </VueFlow>
        </div>

        <!-- Node Detail Drawer -->
        <Sheet v-model:open="drawerOpen">
            <SheetContent side="right" class="w-80 border-l border-bsb-border-standard bg-white p-4">
                <SheetHeader>
                    <SheetTitle class="text-sm font-[590]">
                        {{ selectedNode?.name ?? '节点' }}
                    </SheetTitle>
                </SheetHeader>

                <div v-if="selectedNode" class="mt-4 space-y-4">
                    <div class="space-y-1">
                        <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">类型</p>
                        <Badge variant="outline" :style="{ borderColor: typeColorMap[selectedNode.type] + '60', color: typeColorMap[selectedNode.type], background: typeBgMap[selectedNode.type] }">
                            {{ selectedNode.type }}
                        </Badge>
                    </div>

                    <div v-if="selectedNode.description" class="space-y-1">
                        <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">描述</p>
                        <p class="text-sm text-bsb-text-secondary">{{ selectedNode.description }}</p>
                    </div>

                    <div class="space-y-1">
                        <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">节点 ID</p>
                        <p class="font-mono text-xs text-bsb-text-quaternary">{{ selectedNode.id }}</p>
                    </div>

                    <!-- Parent -->
                    <div v-if="selectedNodeDetail?.parentId" class="space-y-1">
                        <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">父节点</p>
                        <button
                            class="text-sm text-bsb-accent-brand underline-offset-2 hover:underline"
                            @click="
                                router.push(`/room/${selectedNodeDetail.parentId}`);
                                drawerOpen = false;
                            ">
                            查看父节点
                        </button>
                    </div>

                    <!-- Children -->
                    <div v-if="selectedNodeDetail?.children && selectedNodeDetail.children.length > 0" class="space-y-1">
                        <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">直接子节点（{{ selectedNodeDetail.children.length }}）</p>
                        <div class="flex flex-wrap gap-1.5">
                            <Badge
                                v-for="child in selectedNodeDetail.children"
                                :key="child.id"
                                variant="outline"
                                class="cursor-pointer text-xs hover:bg-bsb-bg-surface"
                                @click="
                                    () => {
                                        child.type === 'BOX' ? router.push(`/box/${child.id}`) : router.push(`/room/${child.id}`);
                                        drawerOpen = false;
                                    }
                                ">
                                {{ child.name }}
                            </Badge>
                        </div>
                    </div>

                    <!-- Navigation button -->
                    <Button
                        v-if="selectedNode.type !== 'BOX'"
                        size="sm"
                        variant="outline"
                        class="w-full border-bsb-border-standard text-bsb-text-secondary"
                        @click="
                            () => {
                                router.push(`/room/${selectedNode!.id}`);
                                drawerOpen = false;
                            }
                        ">
                        打开节点页
                    </Button>
                    <Button
                        v-else
                        size="sm"
                        variant="outline"
                        class="w-full border-bsb-border-standard text-bsb-text-secondary"
                        @click="
                            () => {
                                router.push(`/box/${selectedNode!.id}`);
                                drawerOpen = false;
                            }
                        ">
                        打开储存盒
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/minimap/dist/style.css';
@import '@vue-flow/controls/dist/style.css';
</style>
