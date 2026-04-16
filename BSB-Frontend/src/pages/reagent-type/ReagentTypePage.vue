<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Plus, Trash2, Edit3, Tag } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrgStore } from '@/stores/org';
import { createReagentType, listReagentTypes, updateReagentType, deleteReagentType } from '@/api/modules/reagent-type';
import type { ReagentTypeItem } from '@/api/modules/reagent-type';
import { pageTransitionIn, staggerListIn } from '@/utils/animation';

const org = useOrgStore();

const types = ref<ReagentTypeItem[]>([]);
const loading = ref(false);

// Create
const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const newColor = ref('#0075de');
const newUnit = ref('');
const creating = ref(false);
const createError = ref('');

// Edit
const editDialogOpen = ref(false);
const editTarget = ref<ReagentTypeItem | null>(null);
const editName = ref('');
const editDesc = ref('');
const editColor = ref('');
const editUnit = ref('');
const editSaving = ref(false);

const COLOR_PRESETS = ['#0075de', '#2a9d99', '#1aae39', '#dd5b00', '#ff64c8', '#391c57', '#213183', '#523410', '#a39e98', '#615d59'];

async function fetchTypes() {
    if (!org.currentOrgId) return;
    loading.value = true;
    try {
        // types.value = await listReagentTypes(org.currentOrgId).send();
        setTimeout(() => staggerListIn('tr.reagent-type-row'), 50);
    } catch {
        /* empty */
    } finally {
        loading.value = false;
    }
}

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        const created = await createReagentType({
            orgId: org.currentOrgId,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            colorHex: newColor.value || undefined,
            unit: newUnit.value.trim() || undefined
        }).send();
        types.value.push(created);
        newName.value = '';
        newDesc.value = '';
        newColor.value = '#0075de';
        newUnit.value = '';
        createDialogOpen.value = false;
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}

function openEdit(item: ReagentTypeItem) {
    editTarget.value = item;
    editName.value = item.name;
    editDesc.value = item.description ?? '';
    editColor.value = item.colorHex ?? '#0075de';
    editUnit.value = item.unit ?? '';
    editDialogOpen.value = true;
}

async function handleEdit() {
    if (!editTarget.value) return;
    editSaving.value = true;
    try {
        const updated = await updateReagentType({
            id: editTarget.value.id,
            name: editName.value || undefined,
            description: editDesc.value || undefined,
            colorHex: editColor.value || undefined,
            unit: editUnit.value || undefined
        }).send();
        const idx = types.value.findIndex((t) => t.id === updated.id);
        if (idx >= 0) types.value[idx] = updated;
        editDialogOpen.value = false;
    } catch {
        /* empty */
    } finally {
        editSaving.value = false;
    }
}

async function handleDelete(id: string) {
    try {
        await deleteReagentType(id).send();
        types.value = types.value.filter((t) => t.id !== id);
    } catch {
        /* empty */
    }
}

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    await fetchTypes();
});
watch(() => org.currentOrgId, fetchTypes);
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Tag class="size-5 text-bsb-text-tertiary" />
                <h1 class="text-2xl font-semibold text-bsb-text-primary">试剂类型</h1>
            </div>
            <Dialog v-model:open="createDialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        新建类型
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>新建试剂类型</DialogTitle></DialogHeader>
                    <div class="space-y-3">
                        <div class="space-y-1.5">
                            <Label>
                                名称
                                <span class="text-red-500">*</span>
                            </Label>
                            <Input v-model="newName" placeholder="例：青霉素" class="border-bsb-border-standard" />
                        </div>
                        <div class="space-y-1.5">
                            <Label>颜色标识</Label>
                            <div class="flex flex-wrap gap-2">
                                <button v-for="c in COLOR_PRESETS" :key="c" class="size-6 rounded-md transition-all" :style="{ background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }" @click="newColor = c" />
                            </div>
                            <div class="flex items-center gap-2">
                                <input v-model="newColor" type="color" class="size-8 cursor-pointer rounded border border-bsb-border-standard" />
                                <code class="text-xs text-bsb-text-tertiary">{{ newColor }}</code>
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <Label>单位</Label>
                            <Input v-model="newUnit" placeholder="例：mL, mg, μg" class="border-bsb-border-standard" />
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

        <!-- Table -->
        <div class="rounded-lg border border-bsb-border-standard bg-white">
            <Table>
                <TableHeader>
                    <TableRow class="border-b border-bsb-border-standard hover:bg-transparent">
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">色标</TableHead>
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">名称</TableHead>
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">单位</TableHead>
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">描述</TableHead>
                        <TableHead class="w-20 text-xs font-medium text-bsb-text-tertiary">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-if="loading">
                        <TableCell colspan="5" class="py-6 text-center text-sm text-bsb-text-quaternary">加载中…</TableCell>
                    </TableRow>
                    <TableRow v-else-if="types.length === 0">
                        <TableCell colspan="5" class="py-8 text-center text-sm text-bsb-text-quaternary">暂无试剂类型，点击"新建类型"添加第一个</TableCell>
                    </TableRow>
                    <TableRow v-for="t in types" :key="t.id" class="reagent-type-row border-b border-bsb-border-standard hover:bg-bsb-bg-surface/50">
                        <TableCell>
                            <div v-if="t.colorHex" class="size-5 rounded" :style="{ background: t.colorHex }" :title="t.colorHex" />
                            <div v-else class="size-5 rounded border border-bsb-border-standard bg-bsb-bg-surface" />
                        </TableCell>
                        <TableCell class="text-sm font-medium text-bsb-text-primary">{{ t.name }}</TableCell>
                        <TableCell>
                            <Badge v-if="t.unit" variant="outline" class="text-xs text-bsb-text-tertiary">{{ t.unit }}</Badge>
                            <span v-else class="text-xs text-bsb-text-quaternary">—</span>
                        </TableCell>
                        <TableCell class="max-w-48 truncate text-xs text-bsb-text-tertiary">{{ t.description ?? '—' }}</TableCell>
                        <TableCell>
                            <div class="flex items-center gap-1">
                                <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-bsb-text-secondary" @click="openEdit(t)">
                                    <Edit3 class="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleDelete(t.id)">
                                    <Trash2 class="size-3.5" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editDialogOpen">
        <DialogContent>
            <DialogHeader><DialogTitle>编辑试剂类型</DialogTitle></DialogHeader>
            <div class="space-y-3">
                <div class="space-y-1.5">
                    <Label>名称</Label>
                    <Input v-model="editName" class="border-bsb-border-standard" />
                </div>
                <div class="space-y-1.5">
                    <Label>颜色标识</Label>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="c in COLOR_PRESETS" :key="c" class="size-6 rounded-md transition-all" :style="{ background: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }" @click="editColor = c" />
                    </div>
                    <div class="flex items-center gap-2">
                        <input v-model="editColor" type="color" class="size-8 cursor-pointer rounded border border-bsb-border-standard" />
                        <code class="text-xs text-bsb-text-tertiary">{{ editColor }}</code>
                    </div>
                </div>
                <div class="space-y-1.5">
                    <Label>单位</Label>
                    <Input v-model="editUnit" class="border-bsb-border-standard" />
                </div>
                <div class="space-y-1.5">
                    <Label>描述</Label>
                    <Input v-model="editDesc" class="border-bsb-border-standard" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="editDialogOpen = false">取消</Button>
                <Button :disabled="editSaving" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleEdit">
                    {{ editSaving ? '保存中…' : '保存' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
