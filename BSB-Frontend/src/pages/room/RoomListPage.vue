<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Home, ChevronRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

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
                <h1 class="text-2xl font-semibold text-bsb-text-primary">库室</h1>
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

        <!-- Room grid -->
        <div v-if="nodeStore.nodes.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card v-for="node in nodeStore.rootNodes" :key="node.id" class="room-card cursor-pointer border-bsb-border-standard bg-white transition-all hover:border-[#0075de]/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]" @click="router.push(`/room/${node.id}`)">
                <CardHeader class="pb-2">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="flex size-8 items-center justify-center rounded-lg bg-[#f2f9ff] text-bsb-accent-brand">
                                <Home class="size-4" />
                            </div>
                            <CardTitle class="text-sm text-bsb-text-primary">{{ node.name }}</CardTitle>
                        </div>
                        <ChevronRight class="size-4 text-bsb-text-quaternary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p v-if="node.description" class="line-clamp-2 text-xs text-bsb-text-tertiary">{{ node.description }}</p>
                    <p v-else class="text-xs text-bsb-text-quaternary">暂无描述</p>
                    <div class="mt-2 flex items-center gap-1">
                        <Badge variant="outline" class="text-xs text-bsb-text-quaternary">{{ node._count?.children ?? 0 }} 个子节点</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div v-else-if="!nodeStore.loading" class="flex flex-col items-center justify-center py-16 text-center">
            <Home class="mb-3 size-10 text-bsb-text-quaternary" />
            <p class="text-sm font-medium text-bsb-text-secondary">暂无库室</p>
            <p class="mt-1 text-xs text-bsb-text-quaternary">点击"新建库室"创建第一个储存空间</p>
        </div>

        <div v-if="nodeStore.loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-xl bg-bsb-bg-surface" />
        </div>
    </div>
</template>
