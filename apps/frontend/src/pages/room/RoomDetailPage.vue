<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Camera, Home, Plus, Network, Trash2, X } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setGridConfig, getNode, addNodeImage, removeNodeImage } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import type { NodeImage } from '@/schemas/node.schema';
import { serverUploadImage, getPublicFileUrl } from '@/api/modules/file';
import { useNodeStore } from '@/stores/node';
import { useOrgStore } from '@/stores/org';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const router = useRouter();
const nodeStore = useNodeStore();
const org = useOrgStore();

const nodeId = computed(() => String(route.params.id));

const roomNode = ref<NodeItem | null>(null);
const children = ref<NodeItem[]>([]);
const nodeImages = ref<NodeImage[]>([]);
const imageUploading = ref(false);
const imageUploadMsg = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const newType = ref<'BOX' | 'CONTAINER'>('CONTAINER');
const creating = ref(false);
const createError = ref('');
const newRows = ref(9);
const newCols = ref(9);

const isNarrow = ref(false);
function updateWidth() {
    isNarrow.value = window.innerWidth < 768;
}

const deleteDialogOpen = ref(false);

const typeColorMap: Record<string, string> = {
    BOX: 'border-[#0075de]/30 text-[#0075de] bg-[#f2f9ff]',
    CONTAINER: 'border-[#2a9d99]/30 text-[#2a9d99] bg-[#f0fafa]',
    ROOM: 'border-[#213183]/30 text-[#213183] bg-[#f0f2ff]'
};

function updateNodeData() {
    const detail = nodeStore.getNodeDetail(nodeId.value);
    if (detail) {
        roomNode.value = detail;
        children.value = detail.children ?? [];
    } else {
        roomNode.value = null;
        children.value = [];
    }
}

async function loadNodeImages() {
    try {
        const node = await getNode(nodeId.value).send();
        nodeImages.value = node.images ?? [];
    } catch {
        /* empty */
    }
}

async function handleUploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    imageUploading.value = true;
    imageUploadMsg.value = '';
    try {
        const uploaded = await serverUploadImage(file).send();
        const imageUrl = await getPublicFileUrl(uploaded.fileId).send();
        await addNodeImage({ nodeId: nodeId.value, imageUrl }).send();
        await loadNodeImages();
        imageUploadMsg.value = '上传成功';
    } catch {
        imageUploadMsg.value = '上传失败，请重试';
    } finally {
        imageUploading.value = false;
        input.value = '';
        setTimeout(() => (imageUploadMsg.value = ''), 3000);
    }
}

async function handleDeleteImage(id: string) {
    try {
        await removeNodeImage(id).send();
        nodeImages.value = nodeImages.value.filter((img) => img.id !== id);
    } catch {
        /* empty */
    }
}

onMounted(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    if (org.currentOrgId) {
        nodeStore.fetchByOrg(org.currentOrgId);
        loadNodeImages();
    }
});

watch(
    () => org.currentOrgId,
    async (orgId) => {
        if (!orgId) return;
        try {
            nodeStore.fetchByOrg(orgId, true);
            updateNodeData();
            setTimeout(() => staggerListIn('.child-card'), 50);
        } catch {
            /* empty */
        }
    }
);

watch(
    () => nodeId.value,
    () => {
        updateNodeData();
        loadNodeImages();
    },
    { immediate: true }
);

const currentNode = computed(() => nodeStore.getNodeDetail(nodeId.value));

onUnmounted(() => window.removeEventListener('resize', updateWidth));

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        if (newType.value === 'BOX') {
            const created = await nodeStore.addNode({
                orgId: org.currentOrgId,
                parentId: nodeId.value,
                name: newName.value.trim(),
                description: newDesc.value.trim() || undefined,
                type: 'BOX'
            });
            await setGridConfig({ nodeId: created.id, rows: newRows.value, cols: newCols.value }).send();
            children.value.push(created);
        } else {
            const created = await nodeStore.addNode({
                orgId: org.currentOrgId,
                parentId: nodeId.value,
                name: newName.value.trim(),
                description: newDesc.value.trim() || undefined,
                type: newType.value
            });
            children.value.push(created);
        }
        newName.value = '';
        newDesc.value = '';
        newRows.value = 9;
        newCols.value = 9;
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

function handleRouterBack() {
    const parentId = currentNode.value?.parentId;
    if (parentId) return router.push(`/room/${parentId}`);
    return router.push('/room');
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <Button variant="ghost" size="icon" class="shrink-0 text-bsb-text-tertiary hover:text-bsb-text-primary" @click="handleRouterBack">
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex items-center gap-2.5">
                <div class="flex size-8 items-center justify-center rounded-lg bg-[#f2f9ff] text-bsb-accent-brand">
                    <Home class="size-4" />
                </div>
                <div>
                    <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">{{ roomNode?.name ?? '加载中…' }}</h1>
                    <p v-if="roomNode?.description" class="text-xs text-bsb-text-tertiary">{{ roomNode.description }}</p>
                </div>
            </div>

            <div class="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary" @click="router.push('/node')">
                    <Network class="size-4" />
                    在节点图中查看
                </Button>
                <Dialog v-model:open="deleteDialogOpen">
                    <Button variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-500" @click="deleteDialogOpen = true">
                        <Trash2 class="size-4" />
                    </Button>
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
                <h2 class="text-sm font-emphasis text-bsb-text-secondary">子节点（{{ children.length }}）</h2>
                <Button size="sm" variant="outline" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary hover:text-bsb-text-primary" @click="createDialogOpen = true">
                    <Plus class="size-4" />
                    添加子节点
                </Button>
            </div>

            <!-- Narrow: Drawer -->
            <Drawer v-if="isNarrow" v-model:open="createDialogOpen">
                <DrawerContent>
                    <DrawerHeader><DrawerTitle>添加子节点</DrawerTitle></DrawerHeader>
                    <div class="space-y-3 p-4">
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
                                <SelectTrigger class="border-bsb-border-standard"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BOX">BOX（储存盒）</SelectItem>
                                    <SelectItem value="CONTAINER">CONTAINER（通用容器）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <template v-if="newType === 'BOX'">
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <Label>行数</Label>
                                    <Input v-model.number="newRows" type="number" min="1" max="99" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>列数</Label>
                                    <Input v-model.number="newCols" type="number" min="1" max="99" class="border-bsb-border-standard" />
                                </div>
                            </div>
                        </template>
                        <div class="space-y-1.5">
                            <Label>描述</Label>
                            <Input v-model="newDesc" placeholder="可选" class="border-bsb-border-standard" />
                        </div>
                        <p v-if="createError" class="text-xs text-red-500">{{ createError }}</p>
                    </div>
                    <DrawerFooter class="flex gap-2">
                        <Button variant="outline" @click="createDialogOpen = false">取消</Button>
                        <Button :disabled="creating || !newName.trim()" class="flex-1 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreate">
                            {{ creating ? '创建中…' : '创建' }}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <!-- Wide: Dialog -->
            <Dialog v-else v-model:open="createDialogOpen">
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
                                <SelectTrigger class="border-bsb-border-standard"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BOX">BOX（储存盒）</SelectItem>
                                    <SelectItem value="CONTAINER">CONTAINER（通用容器）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <template v-if="newType === 'BOX'">
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <Label>行数</Label>
                                    <Input v-model.number="newRows" type="number" min="1" max="99" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>列数</Label>
                                    <Input v-model.number="newCols" type="number" min="1" max="99" class="border-bsb-border-standard" />
                                </div>
                            </div>
                        </template>
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

            <div v-if="children.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Card v-for="child in children" :key="child.id" class="child-card cursor-pointer border-bsb-border-standard bg-white transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]" @click="child.type === 'BOX' ? router.push(`/box/${child.id}`) : router.push(`/room/${child.id}`)">
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

        <!-- Images section -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-emphasis text-bsb-text-secondary">节点图片（{{ nodeImages.length }}）</h2>
                <Button size="sm" variant="outline" :disabled="imageUploading" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary hover:text-bsb-text-primary" @click="fileInputRef?.click()">
                    <Camera class="size-4" />
                    {{ imageUploading ? '上传中…' : '上传图片' }}
                </Button>
            </div>
            <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="handleUploadImage" />
            <p v-if="imageUploadMsg" class="text-xs" :class="imageUploadMsg.includes('失败') ? 'text-red-500' : 'text-green-600'">{{ imageUploadMsg }}</p>
            <div v-if="nodeImages.length > 0" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <div v-for="img in nodeImages" :key="img.id" class="group relative aspect-square overflow-hidden rounded-md border border-bsb-border-standard">
                    <img :src="img.imageUrl" alt="节点图片" class="h-full w-full object-cover" />
                    <button class="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100" @click="handleDeleteImage(img.id)">
                        <X class="size-3" />
                    </button>
                </div>
            </div>
            <p v-else-if="!imageUploading" class="text-sm text-bsb-text-quaternary">暂无图片</p>
        </div>
    </div>
</template>
