<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Search, Users, Globe, Compass } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'vue-router';
import { useOrgStore } from '@/stores/org';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

const org = useOrgStore();
const router = useRouter();

interface PublicOrg {
    id: string;
    name: string;
    description: string;
    avatarUrl: string | null;
    _count: { members: number };
}

const results = ref<PublicOrg[]>([]);
const keyword = ref('');
const loading = ref(false);
const searched = ref(false);

async function handleSearch() {
    loading.value = true;
    searched.value = true;
    try {
        results.value = await org.explore(keyword.value.trim() || undefined);
        setTimeout(() => staggerListIn('.explore-card'), 50);
    } catch {
        /* empty */
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    await handleSearch();
});
</script>

<template>
    <div class="space-y-6">
        <div>
            <div class="flex items-center gap-2">
                <Compass class="size-5 text-bsb-accent-brand" />
                <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">探索组织</h1>
            </div>
            <p class="mt-1 text-sm text-bsb-text-tertiary">发现公开组织并申请加入</p>
        </div>

        <!-- Search -->
        <div class="flex gap-2 max-w-md">
            <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
                <Input v-model="keyword" placeholder="搜索组织名称…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10" @keyup.enter="handleSearch" />
            </div>
            <Button :disabled="loading" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleSearch">
                {{ loading ? '搜索中…' : '搜索' }}
            </Button>
        </div>

        <!-- Results -->
        <div v-if="results.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card v-for="o in results" :key="o.id" class="explore-card cursor-pointer border-bsb-border-standard bg-white transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]" @click="router.push(`/org/${o.id}`)">
                <CardHeader class="pb-2">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="flex size-9 items-center justify-center rounded-lg bg-[#f2f9ff] text-sm font-bold text-[#097fe8]">
                                {{ o.name.slice(0, 2).toUpperCase() }}
                            </div>
                            <div>
                                <CardTitle class="text-sm text-bsb-text-primary">{{ o.name }}</CardTitle>
                            </div>
                        </div>
                        <Badge variant="outline" class="text-xs border-bsb-accent-brand/30 text-bsb-accent-brand">
                            <Globe class="mr-1 size-3" />
                            公开
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent class="space-y-2">
                    <p class="line-clamp-2 text-xs text-bsb-text-tertiary">{{ o.description || '暂无描述' }}</p>
                    <div class="flex items-center gap-1 text-xs text-bsb-text-quaternary">
                        <Users class="size-3" />
                        {{ o._count.members }} 位成员
                    </div>
                </CardContent>
            </Card>
        </div>

        <p v-else-if="searched && !loading" class="text-sm text-bsb-text-quaternary">未找到公开组织{{ keyword ? `「${keyword}」` : '' }}</p>
    </div>
</template>
