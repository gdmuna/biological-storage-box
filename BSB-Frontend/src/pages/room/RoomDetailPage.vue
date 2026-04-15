<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Home, Plus, Network, Trash2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeStore } from '@/stores/node';
import { useOrgStore } from '@/stores/org';
import { getNode, filterNodes } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const router = useRouter();
const nodeStore = useNodeStore();
const org = useOrgStore();

const nodeId = computed(() => route.params.id as string);

const roomNode = ref<NodeItem | null>(null);
const children = ref<NodeItem[]>([]);

const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const newType = ref<'BOX' | 'CONTAINER'>('CONTAINER');
const creating = ref(false);
const createError = ref('');

const deleteDialogOpen = ref(false);

const typeColorMap: Record<string, string> = {
    BOX: 'border-[#0075de]/30 text-[#0075de] bg-[#f2f9ff]',
    CONTAINER: 'border-[#2a9d99]/30 text-[#2a9d99] bg-[#f0fafa]',
    ROOM: 'border-[#213183]/30 text-[#213183] bg-[#f0f2ff]'
};

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);

    try {
        [roomNode.value, children.value] = await Promise.all([getNode(nodeId.value).send(), filterNodes({ orgId: org.currentOrgId!, parentId: nodeId.value }).send()]);
        setTimeout(() => staggerListIn('.child-card'), 50);
    } catch {
        /* empty */
    }
});

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        const created = await nodeStore.addNode({
            orgId: org.currentOrgId,
            parentId: nodeId.value,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            type: newType.value
        });
        children.value.push(created);
        newName.value = '';
        newDesc.value = '';
        createDialogOpen.value = false;
        setTimeout(() => staggerListIn('.child-card'), 50);
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}

async function handleDelete() {
    try {
        await nodeStore.removeNode(nodeId.value);
        router.push('/room');
    } catch {
        /* empty */
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <Button variant="ghost" size="icon" class="shrink-0 text-bsb-text-tertiary hover:text-bsb-text-primary" @click="router.push('/room')">
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex items-center gap-2.5">
                <div class="flex size-8 items-center justify-center rounded-lg bg-[#f2f9ff] text-bsb-accent-brand">
                    <Home class="size-4" />
                </div>
                <div>
                    <h1 class="text-2xl font-[590] text-bsb-text-primary">{{ roomNode?.name ?? '加载中…' }}</h1>
                    <p v-if="roomNode?.description" class="text-xs text-bsb-text-tertiary">{{ roomNode.description }}</p>
                </div>
            </div>

            <div class="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary" @click="router.push('/node')">
                    <Network class="size-4" />
                    在节点图中查看
                </Button>
                <Dialog v-model:open="deleteDialogOpen">
                    <DialogTrigger as-child>
                        <Button variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-500">
                            <Trash2 class="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>确认删除房间？</DialogTitle></DialogHeader>
                        <p class="text-sm text-bsb-text-secondary">删除后无法恢复，且会递归删除所有子节点。</p>
                        <DialogFooter>
                            <Button variant="outline" @click="deleteDialogOpen = false">取消</Button>
                            <Button class="bg-red-600 text-white hover:bg-red-700" @click="handleDelete">确认删除</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        <!-- Children section -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-[510] text-bsb-text-secondary">子节点（{{ children.length }}）</h2>
                <Dialog v-model:open="createDialogOpen">
                    <DialogTrigger as-child>
                        <Button size="sm" variant="outline" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary hover:text-bsb-text-primary">
                            <Plus class="size-4" />
                            添加子节点
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>添加子节点</DialogTitle></DialogHeader>
                        <div class="space-y-3">
                            <div class="space-y-1.5">
                                <Label>
                                    名称
                                    <span class="text-red-500">*</span>
                                </Label>
                                <Input v-model="newName" placeholder="例：A01 货架" class="border-bsb-border-standard" />
                            </div>
                            <div class="space-y-1.5">
                                <Label>类型</Label>
                                <Select v-model="newType">
                                    <SelectTrigger class="border-bsb-border-standard">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BOX">BOX（储存盒）</SelectItem>
                                        <SelectItem value="CONTAINER">CONTAINER（通用容器）</SelectItem>
                                    </SelectContent>
                                </Select>
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

            <div v-if="children.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Card v-for="child in children" :key="child.id" class="child-card cursor-pointer border-bsb-border-standard bg-white transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]" @click="child.type === 'BOX' ? router.push(`/box/${child.id}`) : undefined">
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm text-bsb-text-primary">{{ child.name }}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" :class="typeColorMap[child.type] ?? ''">{{ child.type }}</Badge>
                        <p v-if="child.description" class="mt-1 text-xs text-bsb-text-quaternary">{{ child.description }}</p>
                    </CardContent>
                </Card>
            </div>
            <p v-else class="text-sm text-bsb-text-quaternary">暂无子节点</p>
        </div>
    </div>
</template>
