<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { getNodeTree } from '@/api/modules/node';
import type { NodeWithChildren } from '@/schemas/node.schema';
import { useOrgStore } from '@/stores/org';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-vue-next';

const org = useOrgStore();

const nodes = ref<NodeWithChildren[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function fetchTree() {
    if (!org.currentOrgId) return;
    loading.value = true;
    error.value = null;
    try {
        nodes.value = await getNodeTree(org.currentOrgId).send();
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '加载失败';
    } finally {
        loading.value = false;
    }
}

onMounted(fetchTree);
watch(() => org.currentOrgId, fetchTree);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center gap-2">
            <MapPin class="h-5 w-5 text-bsb-accent-brand" />
            <h1 class="text-2xl font-[590] text-bsb-text-primary">节点管理</h1>
        </div>

        <p class="text-sm text-bsb-text-secondary">通过树形节点结构管理储存位置，例如建筑 → 楼层 → 房间 → 冰箱 → 层架。</p>

        <Card class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardHeader>
                <CardTitle class="text-base text-bsb-text-primary">节点树</CardTitle>
            </CardHeader>
            <CardContent>
                <p v-if="loading" class="text-sm text-bsb-text-secondary">加载中…</p>
                <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>
                <p v-else-if="!org.currentOrgId" class="text-sm text-bsb-text-secondary">请先选择组织</p>
                <div v-else-if="nodes.length === 0" class="py-4 text-center text-sm text-bsb-text-secondary">当前组织暂无节点</div>
                <ul v-else class="space-y-0.5">
                    <template v-for="node in nodes" :key="node.id">
                        <li class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bsb-bg-subtle">
                            <span class="h-4 w-4 shrink-0 rounded-sm bg-bsb-accent-brand/10 flex items-center justify-center">
                                <MapPin class="h-2.5 w-2.5 text-bsb-accent-brand" />
                            </span>
                            <span class="text-bsb-text-primary font-medium">{{ node.name }}</span>
                            <span v-if="node.description" class="ml-auto text-xs text-bsb-text-secondary truncate max-w-[200px]">
                                {{ node.description }}
                            </span>
                        </li>
                        <template v-for="child in node.children" v-if="node.children?.length" :key="child.id">
                            <li class="flex items-center gap-2 rounded-md py-1.5 text-sm hover:bg-bsb-bg-subtle pl-8">
                                <span class="h-3.5 w-3.5 shrink-0 rounded-sm bg-bsb-accent-brand/5 flex items-center justify-center">
                                    <MapPin class="h-2 w-2 text-bsb-accent-brand/70" />
                                </span>
                                <span class="text-bsb-text-primary">{{ child.name }}</span>
                                <span v-if="child.description" class="ml-auto text-xs text-bsb-text-secondary truncate max-w-[200px]">
                                    {{ child.description }}
                                </span>
                            </li>
                        </template>
                    </template>
                </ul>
            </CardContent>
        </Card>
    </div>
</template>
