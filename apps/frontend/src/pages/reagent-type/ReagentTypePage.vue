<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Pencil, Tag } from '@lucide/vue';
import EmptyState from '@/components/EmptyState.vue';
import { useOrgStore } from '@/stores/org';
import { useReagentStore } from '@/stores/reagent';
import { storeToRefs } from 'pinia';

const org = useOrgStore();
const reagentStore = useReagentStore();
const { reagentTypes } = storeToRefs(reagentStore);

// Create dialog
const createOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const newColor = ref('');
const newUnit = ref('');
const creating = ref(false);

// Edit dialog
const editOpen = ref(false);
const editId = ref('');
const editName = ref('');
const editDesc = ref('');
const editColor = ref('');
const editUnit = ref('');
const editing = ref(false);

async function initData(force = false) {
    if (!org.currentOrgId) return;
    try {
        await reagentStore.initData(org.currentOrgId, force);
    } catch {
        /* empty */
    }
}

function openEdit(rt: (typeof reagentTypes.value)[0]) {
    editId.value = rt.id;
    editName.value = rt.name;
    editDesc.value = rt.description ?? '';
    editColor.value = rt.colorHex ?? '';
    editUnit.value = rt.unit ?? '';
    editOpen.value = true;
}

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    try {
        await reagentStore.addReagentType({
            orgId: org.currentOrgId,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            colorHex: newColor.value.trim() || undefined,
            unit: newUnit.value.trim() || undefined
        });
        newName.value = '';
        newDesc.value = '';
        newColor.value = '';
        newUnit.value = '';
        createOpen.value = false;
    } catch {
        /* empty */
    } finally {
        creating.value = false;
    }
}

async function handleEdit() {
    if (!editName.value.trim()) return;
    editing.value = true;
    try {
        await reagentStore.editReagentType({
            id: editId.value,
            name: editName.value.trim(),
            description: editDesc.value.trim() || undefined,
            colorHex: editColor.value.trim() || undefined,
            unit: editUnit.value.trim() || undefined
        });
        editOpen.value = false;
    } catch {
        /* empty */
    } finally {
        editing.value = false;
    }
}

async function handleDelete(id: string) {
    try {
        await reagentStore.removeReagentType(id);
    } catch {
        /* empty */
    }
}

onMounted(() => initData(true));
watch(
    () => org.currentOrgId,
    () => initData(true)
);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">试剂类型管理</h1>
            <Dialog v-model:open="createOpen">
                <DialogTrigger as-child>
                    <Button size="sm" class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        新建类型
                    </Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>新建试剂类型</DialogTitle>
                        <DialogDescription class="sr-only">填写试剂类型的名称、颜色和计量单位</DialogDescription>
                    </DialogHeader>
                    <div class="space-y-4 py-2">
                        <div class="space-y-1.5">
                            <Label>
                                类型名称
                                <span class="text-red-500">*</span>
                            </Label>
                            <Input v-model="newName" placeholder="例如：DNA、蛋白质" class="border-bsb-border-standard" />
                        </div>
                        <div class="space-y-1.5">
                            <Label>描述</Label>
                            <Input v-model="newDesc" placeholder="可选" class="border-bsb-border-standard" />
                        </div>
                        <div class="space-y-1.5">
                            <Label>颜色标识</Label>
                            <div class="flex items-center gap-2">
                                <input v-model="newColor" type="color" class="size-9 cursor-pointer rounded border border-bsb-border-standard p-0.5" />
                                <Input v-model="newColor" placeholder="#hex（可选）" class="flex-1 border-bsb-border-standard" />
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <Label>单位</Label>
                            <Input v-model="newUnit" placeholder="例如：μL、mg（可选）" class="border-bsb-border-standard" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" @click="createOpen = false">取消</Button>
                        <Button :disabled="creating || !newName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreate">
                            {{ creating ? '创建中…' : '确认创建' }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <p class="text-sm text-bsb-text-tertiary">管理组织的试剂类型，用于对试剂进行分类标注。</p>

        <div v-if="reagentTypes.length > 0" class="overflow-hidden rounded-xl border border-bsb-border-standard bg-white">
            <div v-for="(rt, idx) in reagentTypes" :key="rt.id" class="flex items-center gap-3 px-4 py-3" :class="idx !== reagentTypes.length - 1 ? 'border-b border-bsb-border-standard' : ''">
                <span v-if="rt.colorHex" class="inline-block size-4 shrink-0 rounded-full border border-bsb-border-standard" :style="{ background: rt.colorHex }" />
                <span v-else class="inline-block size-4 shrink-0 rounded-full border border-bsb-border-standard bg-bsb-bg-surface" />
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-bsb-text-primary">{{ rt.name }}</span>
                <span v-if="rt.description" class="hidden max-w-xs truncate text-xs text-bsb-text-tertiary sm:block">{{ rt.description }}</span>
                <Badge v-if="rt.unit" variant="outline" class="shrink-0 text-xs text-bsb-text-quaternary">{{ rt.unit }}</Badge>
                <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-bsb-accent-brand" @click="openEdit(rt)">
                        <Pencil class="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleDelete(rt.id)">
                        <Trash2 class="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
        <EmptyState v-else :icon="Tag" title="暂无试剂类型" description="点击右上角“新建类型”开始建立分类" />

        <!-- Edit Dialog -->
        <Dialog v-model:open="editOpen">
            <DialogContent class="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>编辑试剂类型</DialogTitle>
                    <DialogDescription class="sr-only">修改试剂类型的名称、颜色和计量单位</DialogDescription>
                </DialogHeader>
                <div class="space-y-4 py-2">
                    <div class="space-y-1.5">
                        <Label>
                            类型名称
                            <span class="text-red-500">*</span>
                        </Label>
                        <Input v-model="editName" placeholder="例如：DNA、蛋白质" class="border-bsb-border-standard" />
                    </div>
                    <div class="space-y-1.5">
                        <Label>描述</Label>
                        <Input v-model="editDesc" placeholder="可选" class="border-bsb-border-standard" />
                    </div>
                    <div class="space-y-1.5">
                        <Label>颜色标识</Label>
                        <div class="flex items-center gap-2">
                            <input v-model="editColor" type="color" class="size-9 cursor-pointer rounded border border-bsb-border-standard p-0.5" />
                            <Input v-model="editColor" placeholder="#hex（可选）" class="flex-1 border-bsb-border-standard" />
                        </div>
                    </div>
                    <div class="space-y-1.5">
                        <Label>单位</Label>
                        <Input v-model="editUnit" placeholder="例如：μL、mg（可选）" class="border-bsb-border-standard" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" @click="editOpen = false">取消</Button>
                    <Button :disabled="editing || !editName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleEdit">
                        {{ editing ? '保存中…' : '保存更改' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
