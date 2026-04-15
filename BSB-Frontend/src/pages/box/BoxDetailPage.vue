<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-vue-next';
import { getBox, listReagents, deleteBox, updateReagent, createReagent } from '@/api/modules/box';
import { uploadFile } from '@/api/modules/file';
import { createBoxImage, listBoxImages, deleteBoxImage } from '@/api/modules/box-image';
import { createFeedback, listBoxLogs } from '@/api/modules/feedback';
import { listReagentTypes } from '@/api/modules/reagent-type';
import type { ReagentTypeItem } from '@/api/modules/reagent-type';
import { pageTransitionIn } from '@/utils/animation';
import type { Box, Reagent, BoxImage } from '@/schemas/box.schema';

const route = useRoute();
const router = useRouter();
const boxId = computed(() => route.params.id as string);

const box = ref<Box | null>(null);
const reagents = ref<Reagent[]>([]);
const images = ref<BoxImage[]>([]);
const boxLogs = ref<{ id: string; action?: string; createdAt?: string }[]>([]);
const feedbackContent = ref('');
const feedbackMessage = ref('');

// Delete Box
const deleteDialogOpen = ref(false);

// Slot Drawer
const drawerOpen = ref(false);
const drawerCell = ref<{ row: number; col: number; reagent: Reagent | null } | null>(null);
const slotName = ref('');
const slotTypeId = ref('__none__');
const slotDesc = ref('');
const slotSaving = ref(false);
const reagentTypes = ref<ReagentTypeItem[]>([]);
const imageUploading = ref(false);
const imageUploadMsg = ref('');

const grid = computed(() => {
    if (!box.value) return [];
    const rows = box.value.rows;
    const cols = box.value.cols;
    const cells: (Reagent | null)[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    for (const r of reagents.value) {
        const match = r.position.match(/^(\d+)-(\d+)$/);
        if (match) {
            const row = parseInt(match[1], 10) - 1;
            const col = parseInt(match[2], 10) - 1;
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                cells[row][col] = r;
            }
        }
    }
    return cells;
});

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);

    try {
        box.value = await getBox(boxId.value).send();
        reagents.value = await listReagents(boxId.value).send();
        images.value = await listBoxImages(boxId.value).send();
        boxLogs.value = await listBoxLogs({ boxId: boxId.value, limit: 20, offset: 0 }).send();

        if (box.value) {
            reagentTypes.value = await listReagentTypes(box.value.orgId)
                .send()
                .catch(() => []);
        }

        // Stagger grid rows
        setTimeout(() => {
            const rows = document.querySelectorAll<HTMLElement>('.grid-row');
            rows.forEach((row, i) => {
                const cells = row.querySelectorAll<HTMLElement>('.grid-cell');
                cells.forEach((cell) => {
                    cell.style.opacity = '0';
                    cell.style.transform = 'translateY(8%)';
                    cell.style.transition = `opacity 0.22s ease ${i * 0.1}s, transform 0.22s ease ${i * 0.1}s`;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            cell.style.opacity = '1';
                            cell.style.transform = 'translateY(0)';
                        });
                    });
                });
            });
        }, 50);
    } catch {
        /* empty */
    }
});

async function handleDeleteBox() {
    try {
        await deleteBox(boxId.value).send();
        router.push('/box');
    } catch {
        /* empty */
    }
}

function openSlotDrawer(rowIdx: number, colIdx: number) {
    const reagent = grid.value[rowIdx]?.[colIdx] ?? null;
    drawerCell.value = { row: rowIdx + 1, col: colIdx + 1, reagent };
    slotName.value = reagent?.name ?? '';
    slotTypeId.value = reagent?.reagentTypeId ?? '__none__';
    slotDesc.value = reagent?.description ?? '';
    drawerOpen.value = true;
}

async function handleSaveSlot() {
    if (!drawerCell.value || !box.value) return;
    slotSaving.value = true;
    try {
        if (drawerCell.value.reagent) {
            await updateReagent({
                id: drawerCell.value.reagent.id,
                name: slotName.value || undefined,
                description: slotDesc.value || undefined
            }).send();
        }
        reagents.value = await listReagents(boxId.value).send();
        drawerOpen.value = false;
    } catch {
        /* empty */
    } finally {
        slotSaving.value = false;
    }
}

async function handleCreateSlot() {
    if (!drawerCell.value || !box.value || !slotName.value.trim()) return;
    slotSaving.value = true;
    try {
        await createReagent({
            boxId: boxId.value,
            position: `${drawerCell.value.row}-${drawerCell.value.col}`,
            name: slotName.value.trim(),
            description: slotDesc.value.trim() || undefined,
            reagentTypeId: slotTypeId.value !== '__none__' ? slotTypeId.value : undefined
        }).send();
        reagents.value = await listReagents(boxId.value).send();
        drawerOpen.value = false;
    } catch {
        /* empty */
    } finally {
        slotSaving.value = false;
    }
}

async function handleUploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    imageUploading.value = true;
    imageUploadMsg.value = '';
    try {
        const uploaded = await uploadFile(file).send();
        await createBoxImage({ boxId: boxId.value, imageUrl: uploaded.url }).send();
        images.value = await listBoxImages(boxId.value).send();
        imageUploadMsg.value = '上传成功';
    } catch {
        imageUploadMsg.value = '上传失败，请重试';
    } finally {
        imageUploading.value = false;
        input.value = '';
    }
}

async function handleDeleteImage(id: string) {
    try {
        await deleteBoxImage(id).send();
        images.value = await listBoxImages(boxId.value).send();
    } catch {
        /* empty */
    }
}

async function handleSubmitFeedback() {
    if (!feedbackContent.value.trim()) return;
    try {
        await createFeedback({ content: feedbackContent.value.trim() }).send();
        feedbackContent.value = '';
        feedbackMessage.value = '提交成功';
    } catch {
        feedbackMessage.value = '提交失败';
    }
}
</script>

<template>
    <div class="space-y-6">
        <div v-if="box" class="flex items-start justify-between">
            <div>
                <h1 class="text-2xl font-[590] text-bsb-text-primary">{{ box.name }}</h1>
                <p v-if="box.description" class="mt-1 text-sm text-bsb-text-tertiary">
                    {{ box.description }}
                </p>
                <div class="mt-2 flex items-center gap-2">
                    <Badge variant="outline" class="text-bsb-text-tertiary">{{ box.rows }}×{{ box.cols }}</Badge>
                </div>
            </div>
            <Dialog v-model:open="deleteDialogOpen">
                <DialogTrigger as-child>
                    <Button variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-500">
                        <Trash2 class="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>确认删除储存盒？</DialogTitle></DialogHeader>
                    <p class="text-sm text-bsb-text-secondary">删除后所有槽位数据将永久丢失，此操作不可逆。</p>
                    <DialogFooter>
                        <Button variant="outline" @click="deleteDialogOpen = false">取消</Button>
                        <Button class="bg-red-600 text-white hover:bg-red-700" @click="handleDeleteBox">确认删除</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <Separator class="bg-bsb-border-standard" />

        <!-- Grid -->
        <div v-if="box" class="space-y-1.5">
            <div v-for="(row, ri) in grid" :key="ri" class="grid-row flex gap-1.5">
                <div
                    v-for="(cell, ci) in row"
                    :key="`${ri}-${ci}`"
                    class="grid-cell size-20 cursor-pointer rounded-lg border transition-all"
                    :class="cell ? 'border-l-2 border-bsb-accent-brand/40 bg-[#f2f9ff] hover:border-bsb-accent-brand hover:bg-[#e6f2ff]' : 'border-bsb-border-subtle bg-bsb-bg-surface hover:bg-bsb-bg-secondary'"
                    @click="openSlotDrawer(ri, ci)">
                    <div class="flex h-full items-center justify-center p-1.5">
                        <span v-if="cell" class="line-clamp-2 text-center text-[11px] font-medium leading-tight text-bsb-text-secondary">
                            {{ cell.name }}
                        </span>
                        <span v-else class="text-[10px] text-bsb-text-quaternary">{{ ri + 1 }}-{{ ci + 1 }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reagent list -->
        <div v-if="reagents.length > 0" class="space-y-2">
            <h2 class="text-sm font-medium text-bsb-text-secondary">试剂列表</h2>
            <Card v-for="reagent in reagents" :key="reagent.id" class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardHeader class="flex flex-row items-center justify-between py-3">
                    <CardTitle class="text-sm text-bsb-text-primary">{{ reagent.name }}</CardTitle>
                    <Badge variant="outline" class="text-bsb-text-tertiary">
                        {{ reagent.position }}
                    </Badge>
                </CardHeader>
            </Card>
        </div>

        <!-- Images -->
        <div class="space-y-3">
            <h2 class="text-sm font-medium text-bsb-text-secondary">图片</h2>
            <div class="flex items-center gap-3">
                <label class="cursor-pointer">
                    <span class="inline-flex h-9 items-center gap-2 rounded-md border border-bsb-border-standard bg-white px-3 text-sm text-bsb-text-secondary transition hover:bg-bsb-bg-surface" :class="imageUploading ? 'opacity-50 pointer-events-none' : ''">
                        <span v-if="imageUploading">上传中…</span>
                        <span v-else>选择图片</span>
                    </span>
                    <input type="file" accept="image/*" class="sr-only" :disabled="imageUploading" @change="handleUploadImage" />
                </label>
                <span v-if="imageUploadMsg" class="text-xs" :class="imageUploadMsg.includes('失败') ? 'text-red-500' : 'text-green-600'">{{ imageUploadMsg }}</span>
            </div>
            <div v-if="images.length > 0" class="space-y-2">
                <div v-for="img in images" :key="img.id" class="flex items-center justify-between rounded border border-bsb-border-standard p-2 text-xs">
                    <span class="truncate">{{ img.imageUrl }}</span>
                    <Button size="sm" variant="outline" @click="handleDeleteImage(img.id)">删除</Button>
                </div>
            </div>
        </div>

        <div class="space-y-3">
            <h2 class="text-sm font-medium text-bsb-text-secondary">反馈</h2>
            <Input v-model="feedbackContent" placeholder="输入反馈内容" />
            <Button @click="handleSubmitFeedback">提交反馈</Button>
            <p v-if="feedbackMessage" class="text-xs text-bsb-text-secondary">{{ feedbackMessage }}</p>
        </div>

        <div v-if="boxLogs.length > 0" class="space-y-2">
            <h2 class="text-sm font-medium text-bsb-text-secondary">最近操作日志</h2>
            <div v-for="log in boxLogs" :key="log.id" class="rounded border border-bsb-border-standard p-2 text-xs text-bsb-text-tertiary">
                <span>{{ log.action || '操作' }}</span>
                <span class="ml-2">{{ log.createdAt }}</span>
            </div>
        </div>

        <!-- Slot Drawer -->
        <Sheet v-model:open="drawerOpen">
            <SheetContent side="right" class="w-80 border-l border-bsb-border-standard bg-white">
                <SheetHeader>
                    <SheetTitle class="text-sm font-[590]">
                        槽位 {{ drawerCell?.row }}-{{ drawerCell?.col }}
                        <span v-if="drawerCell?.reagent" class="ml-2 text-xs font-normal text-bsb-text-tertiary">（编辑试剂）</span>
                        <span v-else class="ml-2 text-xs font-normal text-bsb-text-tertiary">（空槽）</span>
                    </SheetTitle>
                </SheetHeader>

                <div class="mt-4 space-y-4">
                    <div class="space-y-1.5">
                        <Label>试剂名称</Label>
                        <Input v-model="slotName" placeholder="输入试剂名称…" class="border-bsb-border-standard" />
                    </div>

                    <div class="space-y-1.5">
                        <Label>备注</Label>
                        <Input v-model="slotDesc" placeholder="可选" class="border-bsb-border-standard" />
                    </div>

                    <div class="space-y-1.5">
                        <Label>试剂类型</Label>
                        <Select v-model="slotTypeId">
                            <SelectTrigger class="border-bsb-border-standard">
                                <SelectValue placeholder="选择试剂类型（可选）" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">无</SelectItem>
                                <SelectItem v-for="rt in reagentTypes" :key="rt.id" :value="rt.id">
                                    <div class="flex items-center gap-2">
                                        <span v-if="rt.colorHex" class="inline-block size-3 rounded-full" :style="{ background: rt.colorHex }" />
                                        {{ rt.name }}
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button v-if="drawerCell?.reagent" :disabled="slotSaving" class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleSaveSlot">
                        {{ slotSaving ? '保存中…' : '更新试剂' }}
                    </Button>
                    <Button v-else :disabled="slotSaving || !slotName.trim()" class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreateSlot">
                        {{ slotSaving ? '保存中…' : '新增试剂' }}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    </div>
</template>
