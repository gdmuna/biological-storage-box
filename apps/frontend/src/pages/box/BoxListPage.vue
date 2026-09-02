<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, ChevronRight, Box } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState.vue';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { useReagentStore } from '@/stores/reagent';
import type { Node } from '@/schemas/node.schema';

const router = useRouter();
const org = useOrgStore();
const nodeStore = useNodeStore();
const reagentStore = useReagentStore();

const keyword = ref('');

function getBoxOccupancy(boxId: string) {
    return reagentStore.reagents.filter((r) => r.nodeId === boxId).length;
}

// All BOX-type nodes
const boxNodes = computed(() => nodeStore.nodes.filter((n) => n.type === 'BOX'));

// Search results
const isSearching = computed(() => !!keyword.value.trim());
const searchResults = computed(() => {
    if (!isSearching.value) return [];
    const kw = keyword.value.trim().toLowerCase();
    return boxNodes.value.filter((n) => n.name.toLowerCase().includes(kw));
});

// Grouped by parent
interface BoxGroup {
    nodeId: string | null;
    nodeName: string | null;
    boxes: Node[];
}

const groups = computed<BoxGroup[]>(() => {
    const map = new Map<string | null, BoxGroup>();
    for (const box of boxNodes.value) {
        const parentId = box.parentId ?? null;
        const parentName = parentId ? (nodeStore.nodes.find((n) => n.id === parentId)?.name ?? null) : null;
        if (!map.has(parentId)) {
            map.set(parentId, { nodeId: parentId, nodeName: parentName, boxes: [] });
        }
        map.get(parentId)!.boxes.push(box);
    }
    return Array.from(map.values());
});

onMounted(() => {
    if (org.currentOrgId) nodeStore.fetchByOrg(org.currentOrgId, true);
});
watch(
    () => org.currentOrgId,
    (id) => {
        if (id) nodeStore.fetchByOrg(id, true);
    }
);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">储存盒</h1>
            <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="router.push('/box/new')">
                <Plus class="size-4" />
                新建
            </Button>
        </div>

        <!-- Search -->
        <div class="relative max-w-sm">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
            <Input v-model="keyword" placeholder="搜索储存盒…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10 text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
        </div>

        <!-- Search results -->
        <template v-if="isSearching">
            <div v-if="searchResults.length > 0" class="overflow-hidden rounded-xl border border-bsb-border-standard bg-white">
                <div v-for="(box, idx) in searchResults" :key="box.id" class="box-card flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsb-bg-surface" :class="idx !== searchResults.length - 1 ? 'border-b border-bsb-border-standard' : ''" @click="router.push(`/box/${box.id}`)">
                    <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f0fafa] text-[#2a9d99]">
                        <Box class="size-3.5" />
                    </div>
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-bsb-text-primary">{{ box.name }}</span>
                    <span v-if="box.description" class="hidden max-w-xs truncate text-xs text-bsb-text-tertiary sm:block">{{ box.description }}</span>
                    <Badge variant="outline" class="shrink-0 text-xs text-bsb-text-quaternary">{{ box.gridConfig?.rows }}×{{ box.gridConfig?.cols }}</Badge>
                    <Badge v-if="box.gridConfig" variant="outline" class="shrink-0 text-xs" :class="getBoxOccupancy(box.id) / (box.gridConfig.rows * box.gridConfig.cols) > 0.8 ? 'text-orange-600 border-orange-300' : 'text-bsb-text-quaternary'">{{ getBoxOccupancy(box.id) }}/{{ box.gridConfig.rows * box.gridConfig.cols }} 已用</Badge>
                    <ChevronRight class="size-4 shrink-0 text-bsb-text-quaternary" />
                </div>
            </div>
            <p v-else class="text-sm text-bsb-text-quaternary">未找到匹配的储存盒</p>
        </template>

        <!-- Grouped view -->
        <template v-else>
            <div v-for="group in groups" :key="group.nodeId ?? 'unassigned'" class="space-y-2">
                <h2 class="text-sm font-emphasis text-bsb-text-secondary">{{ group.nodeName ?? '未分配房间' }}</h2>
                <div class="overflow-hidden rounded-xl border border-bsb-border-standard bg-white">
                    <div v-for="(box, idx) in group.boxes" :key="box.id" class="box-card flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsb-bg-surface" :class="idx !== group.boxes.length - 1 ? 'border-b border-bsb-border-standard' : ''" @click="router.push(`/box/${box.id}`)">
                        <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f0fafa] text-[#2a9d99]">
                            <Box class="size-3.5" />
                        </div>
                        <span class="min-w-0 flex-1 truncate text-sm font-medium text-bsb-text-primary">{{ box.name }}</span>
                        <span v-if="box.description" class="hidden max-w-xs truncate text-xs text-bsb-text-tertiary sm:block">{{ box.description }}</span>
                        <Badge variant="outline" class="shrink-0 text-xs text-bsb-text-quaternary">{{ box.gridConfig?.rows }}×{{ box.gridConfig?.cols }}</Badge>
                        <Badge v-if="box.gridConfig" variant="outline" class="shrink-0 text-xs" :class="getBoxOccupancy(box.id) / (box.gridConfig.rows * box.gridConfig.cols) > 0.8 ? 'text-orange-600 border-orange-300' : 'text-bsb-text-quaternary'">{{ getBoxOccupancy(box.id) }}/{{ box.gridConfig.rows * box.gridConfig.cols }} 已用</Badge>
                        <ChevronRight class="size-4 shrink-0 text-bsb-text-quaternary" />
                    </div>
                </div>
            </div>
            <EmptyState v-if="groups.length === 0" :icon="Box" title="暂无储存盒" description="点击“新建”创建第一个储存盒" />
        </template>
    </div>
</template>
