<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Home, ChevronRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';
import EmptyState from '@/components/EmptyState.vue';

const router = useRouter();
const org = useOrgStore();
const nodeStore = useNodeStore();

const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const creating = ref(false);
const createError = ref('');

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        await nodeStore.addNode({
            orgId: org.currentOrgId,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            type: 'ROOT'
        });
        newName.value = '';
        newDesc.value = '';
        createDialogOpen.value = false;
        setTimeout(() => staggerListIn('.room-card'), 50);
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
});

watch(
    () => org.currentOrgId,
    () => {
        if (org.currentOrgId) nodeStore.fetchByOrg(org.currentOrgId);
    }
);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">库室</h1>
            </div>
            <Dialog v-model:open="createDialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        新建库室
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建库室</DialogTitle>
                        <DialogDescription class="sr-only">填写新库室的名称和描述信息</DialogDescription>
                    </DialogHeader>
                    <div class="space-y-3">
                        <div class="space-y-1.5">
                            <Label>
                                名称
                                <span class="text-red-500">*</span>
                            </Label>
                            <Input v-model="newName" placeholder="例：4°C 冷藏间" class="border-bsb-border-standard" />
                        </div>
                        <div class="space-y-1.5">
                            <Label>描述</Label>
                            <Input v-model="newDesc" placeholder="可选" class="border-bsb-border-standard" />
                        </div>
                        <p v-if="createError" class="text-xs text-red-500">{{ createError }}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" @click="createDialogOpen = false">取消</Button>
                        <Button :disabled="creating || !newName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreate">
                            {{ creating ? '创建中…' : '创建' }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <!-- Room list -->
        <div v-if="nodeStore.loading" class="space-y-1">
            <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg bg-bsb-bg-surface" />
        </div>
        <div v-else-if="nodeStore.rootNodes.length > 0" class="overflow-hidden rounded-xl border border-bsb-border-standard bg-white">
            <div v-for="(node, idx) in nodeStore.rootNodes" :key="node.id" class="room-card flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsb-bg-surface" :class="idx !== nodeStore.rootNodes.length - 1 ? 'border-b border-bsb-border-standard' : ''" @click="router.push(`/room/${node.id}`)">
                <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f2f9ff] text-bsb-accent-brand">
                    <Home class="size-3.5" />
                </div>
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-bsb-text-primary">{{ node.name }}</span>
                <span v-if="node.description" class="hidden max-w-xs truncate text-xs text-bsb-text-tertiary sm:block">{{ node.description }}</span>
                <Badge variant="outline" class="shrink-0 text-xs text-bsb-text-quaternary">{{ node._count?.children ?? 0 }} 个储存盒</Badge>
                <ChevronRight class="size-4 shrink-0 text-bsb-text-quaternary" />
            </div>
        </div>
        <EmptyState v-else :icon="Home" title="暂无库室" description="点击“新建库室”创建第一个储存空间" />
    </div>
</template>
