<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrgStore } from '@/stores/org';
import { listBoxesGroupedByRoot, searchBoxes } from '@/api/modules/box';
import { staggerListIn } from '@/utils/animation';
import type { Box } from '@/schemas/box.schema';

const router = useRouter();
const org = useOrgStore();

const keyword = ref('');
const groups = ref<{ rootId: string | null; rootName: string; boxes: Box[] }[]>([]);
const searchResults = ref<Box[]>([]);
const isSearching = ref(false);

async function fetchBoxes() {
    if (!org.currentOrgId) return;
    try {
        const data = await listBoxesGroupedByRoot(org.currentOrgId).send();
        groups.value = data as typeof groups.value;
        setTimeout(() => staggerListIn('.box-card'), 50);
    } catch {
        /* empty */
    }
}

async function handleSearch() {
    if (!keyword.value.trim() || !org.currentOrgId) {
        isSearching.value = false;
        return;
    }
    isSearching.value = true;
    try {
        searchResults.value = await searchBoxes({ orgId: org.currentOrgId, keyword: keyword.value }).send();
    } catch {
        /* empty */
    }
}

onMounted(fetchBoxes);
watch(() => org.currentOrgId, fetchBoxes);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-[590] text-bsb-text-primary">储存盒</h1>
            <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="router.push('/box/new')">
                <Plus class="size-4" />
                新建
            </Button>
        </div>

        <!-- Search -->
        <div class="relative max-w-sm">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
            <Input v-model="keyword" placeholder="搜索储存盒…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10 text-bsb-text-primary placeholder:text-bsb-text-quaternary" @input="handleSearch" />
        </div>

        <!-- Search results -->
        <template v-if="isSearching">
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Card v-for="box in searchResults" :key="box.id" class="box-card cursor-pointer border-bsb-border-standard bg-bsb-bg-panel transition-colors hover:border-bsb-accent-brand/30" @click="router.push(`/box/${box.id}`)">
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm text-bsb-text-primary">{{ box.name }}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" class="text-bsb-text-tertiary">{{ box.rows }}×{{ box.cols }}</Badge>
                    </CardContent>
                </Card>
            </div>
            <p v-if="searchResults.length === 0" class="text-sm text-bsb-text-quaternary">未找到匹配的储存盒</p>
        </template>

        <!-- Grouped view -->
        <template v-else>
            <div v-for="group in groups" :key="group.rootId ?? 'unassigned'" class="space-y-3">
                <h2 class="text-sm font-[510] text-bsb-text-secondary">{{ group.rootName }}</h2>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Card v-for="box in group.boxes" :key="box.id" class="box-card cursor-pointer border-bsb-border-standard bg-bsb-bg-panel transition-colors hover:border-bsb-accent-brand/30" @click="router.push(`/box/${box.id}`)">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm text-bsb-text-primary">{{ box.name }}</CardTitle>
                        </CardHeader>
                        <CardContent class="flex items-center gap-2">
                            <Badge variant="outline" class="text-bsb-text-tertiary">{{ box.rows }}×{{ box.cols }}</Badge>
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
