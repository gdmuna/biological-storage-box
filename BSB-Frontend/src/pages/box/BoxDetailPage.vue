<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getBox, listReagents } from '@/api/modules/box';
import { staggerListIn } from '@/utils/animation';
import type { Box, Reagent } from '@/schemas/box.schema';

const route = useRoute();
const boxId = computed(() => route.params.id as string);

const box = ref<Box | null>(null);
const reagents = ref<Reagent[]>([]);

const grid = computed(() => {
    if (!box.value) return [];
    const rows = box.value.rows;
    const cols = box.value.cols;
    const cells: (Reagent | null)[][] = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => null),
    );
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
        setTimeout(() => staggerListIn('.grid-cell'), 50);
    } catch {
        /* empty */
    }
});
</script>

<template>
    <div class="space-y-6">
        <div v-if="box">
            <h1 class="text-2xl font-[590] text-bsb-text-primary">{{ box.name }}</h1>
            <p v-if="box.description" class="mt-1 text-sm text-bsb-text-tertiary">
                {{ box.description }}
            </p>
            <div class="mt-2 flex items-center gap-2">
                <Badge variant="outline" class="text-bsb-text-tertiary">
                    {{ box.rows }}×{{ box.cols }}
                </Badge>
            </div>
        </div>

        <Separator class="bg-bsb-border-standard" />

        <!-- Grid -->
        <div
            v-if="box"
            class="inline-grid gap-1"
            :style="{ gridTemplateColumns: `repeat(${box.cols}, minmax(0, 1fr))` }"
        >
            <div
                v-for="(row, ri) in grid"
                v-bind:key="ri"
            >
                <Card
                    v-for="(cell, ci) in row"
                    :key="`${ri}-${ci}`"
                    class="grid-cell size-16 cursor-pointer border transition-colors"
                    :class="
                        cell
                            ? 'border-bsb-accent-brand/30 bg-bsb-accent-brand/10 hover:border-bsb-accent-brand/50'
                            : 'border-bsb-border-subtle bg-bsb-bg-surface hover:bg-bsb-bg-secondary'
                    "
                >
                    <CardContent class="flex h-full items-center justify-center p-1">
                        <span
                            v-if="cell"
                            class="truncate text-[10px] text-bsb-text-secondary"
                        >
                            {{ cell.name }}
                        </span>
                        <span v-else class="text-[10px] text-bsb-text-quaternary">
                            {{ ri + 1 }}-{{ ci + 1 }}
                        </span>
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Reagent list -->
        <div v-if="reagents.length > 0" class="space-y-2">
            <h2 class="text-sm font-[510] text-bsb-text-secondary">试剂列表</h2>
            <Card
                v-for="reagent in reagents"
                :key="reagent.id"
                class="border-bsb-border-standard bg-bsb-bg-panel"
            >
                <CardHeader class="flex flex-row items-center justify-between py-3">
                    <CardTitle class="text-sm text-bsb-text-primary">{{ reagent.name }}</CardTitle>
                    <Badge variant="outline" class="text-bsb-text-tertiary">
                        {{ reagent.position }}
                    </Badge>
                </CardHeader>
            </Card>
        </div>
    </div>
</template>
