<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBox, listReagents } from '@/api/modules/box';
import { uploadFile } from '@/api/modules/file';
import { createBoxImage, listBoxImages, compareBoxImage, deleteBoxImage } from '@/api/modules/box-image';
import { createFeedback, listBoxLogs } from '@/api/modules/feedback';
import { staggerListIn } from '@/utils/animation';
import type { Box, Reagent, BoxImage } from '@/schemas/box.schema';

const route = useRoute();
const boxId = computed(() => route.params.id as string);

const box = ref<Box | null>(null);
const reagents = ref<Reagent[]>([]);
const images = ref<BoxImage[]>([]);
const boxLogs = ref<{ id: string; action?: string; createdAt?: string }[]>([]);
const compareImageUrl = ref('');
const compareResult = ref('');
const feedbackContent = ref('');
const feedbackMessage = ref('');

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
    try {
        box.value = await getBox(boxId.value).send();
        reagents.value = await listReagents(boxId.value).send();
        images.value = await listBoxImages(boxId.value).send();
        boxLogs.value = await listBoxLogs({ boxId: boxId.value, limit: 20, offset: 0 }).send();
        setTimeout(() => staggerListIn('.grid-cell'), 50);
    } catch {
        /* empty */
    }
});

async function handleUploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
        const uploaded = await uploadFile(file).send();
        await createBoxImage({ boxId: boxId.value, imageUrl: uploaded.url }).send();
        images.value = await listBoxImages(boxId.value).send();
    } catch {
        /* empty */
    }
}

async function handleCompareImage() {
    if (!compareImageUrl.value.trim()) return;
    try {
        const result = await compareBoxImage({
            boxId: boxId.value,
            imageUrl: compareImageUrl.value.trim()
        }).send();
        compareResult.value = JSON.stringify(result);
    } catch {
        compareResult.value = '比对失败';
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
        <div v-if="box">
            <h1 class="text-2xl font-[590] text-bsb-text-primary">{{ box.name }}</h1>
            <p v-if="box.description" class="mt-1 text-sm text-bsb-text-tertiary">
                {{ box.description }}
            </p>
            <div class="mt-2 flex items-center gap-2">
                <Badge variant="outline" class="text-bsb-text-tertiary">{{ box.rows }}×{{ box.cols }}</Badge>
            </div>
        </div>

        <Separator class="bg-bsb-border-standard" />

        <!-- Grid -->
        <div v-if="box" class="inline-grid gap-1.5" :style="{ gridTemplateColumns: `repeat(${box.cols}, minmax(0, 1fr))` }">
            <div v-for="(row, ri) in grid" v-bind:key="ri">
                <div v-for="(cell, ci) in row" :key="`${ri}-${ci}`" class="grid-cell size-20 cursor-pointer rounded-lg border transition-all" :class="cell ? 'border-l-2 border-bsb-accent-brand/40 bg-[#f2f9ff] hover:border-bsb-accent-brand hover:bg-[#e6f2ff]' : 'border-bsb-border-subtle bg-bsb-bg-surface hover:bg-bsb-bg-secondary'">
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

        <div class="space-y-3">
            <h2 class="text-sm font-medium text-bsb-text-secondary">图片比对</h2>
            <Input type="file" accept="image/*" @change="handleUploadImage" />
            <div class="flex gap-2">
                <Input v-model="compareImageUrl" placeholder="输入待比对图片 URL" />
                <Button @click="handleCompareImage">开始比对</Button>
            </div>
            <p v-if="compareResult" class="text-xs text-bsb-text-secondary">比对结果：{{ compareResult }}</p>

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
    </div>
</template>
