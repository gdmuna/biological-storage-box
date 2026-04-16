<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import type { Node } from '@/schemas/node.schema';

const router = useRouter();
const org = useOrgStore();
const nodeStore = useNodeStore();

const keyword = ref('');

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
            <h1 class="text-2xl font-semibold text-bsb-text-primary">储存盒</h1>
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
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Card v-for="box in searchResults" :key="box.id" class="box-card cursor-pointer border-bsb-border-standard bg-bsb-bg-panel transition-colors hover:border-bsb-accent-brand/30" @click="router.push(`/box/${box.id}`)">
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm text-bsb-text-primary">{{ box.name }}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" class="text-bsb-text-tertiary">{{ box.gridConfig?.rows }}×{{ box.gridConfig?.cols }}</Badge>
                    </CardContent>
                </Card>
            </div>
            <p v-if="searchResults.length === 0" class="text-sm text-bsb-text-quaternary">未找到匹配的储存盒</p>
        </template>

        <!-- Grouped view -->
        <template v-else>
            <div v-for="group in groups" :key="group.nodeId ?? 'unassigned'" class="space-y-3">
                <h2 class="text-sm font-emphasis text-bsb-text-secondary">{{ group.nodeName ?? '未分配房间' }}</h2>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Card v-for="box in group.boxes" :key="box.id" class="box-card cursor-pointer border-bsb-border-standard bg-bsb-bg-panel transition-colors hover:border-bsb-accent-brand/30" @click="router.push(`/box/${box.id}`)">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm text-bsb-text-primary">{{ box.name }}</CardTitle>
                        </CardHeader>
                        <CardContent class="flex items-center gap-2">
                            <Badge variant="outline" class="text-bsb-text-tertiary">{{ box.gridConfig?.rows }}×{{ box.gridConfig?.cols }}</Badge>
                            <span v-if="box.description" class="truncate text-xs text-bsb-text-quaternary">
                                {{ box.description }}
                            </span>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <p v-if="groups.length === 0" class="text-sm text-bsb-text-quaternary">暂无储存盒，点击"新建"创建第一个</p>
        </template>
    </div>
</template>
