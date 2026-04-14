<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrgStore } from '@/stores/org';
import { listReagents, listBoxes } from '@/api/modules/box';
import { staggerListIn } from '@/utils/animation';
import type { Reagent, Box } from '@/schemas/box.schema';

const org = useOrgStore();
const reagents = ref<Reagent[]>([]);
const boxes = ref<Box[]>([]);

async function fetchData() {
    if (!org.currentOrgId) return;
    try {
        const boxList = await listBoxes(org.currentOrgId).send();
        boxes.value = Array.isArray(boxList) ? boxList : [];

        const allReagents: Reagent[] = [];
        for (const box of boxes.value) {
            const r = await listReagents(box.id).send();
            if (Array.isArray(r)) allReagents.push(...r);
        }
        reagents.value = allReagents;
        setTimeout(() => staggerListIn('.reagent-card'), 50);
    } catch {
        /* empty */
    }
}

function getBoxName(boxId: string) {
    return boxes.value.find((b) => b.id === boxId)?.name ?? boxId;
}

onMounted(fetchData);
watch(() => org.currentOrgId, fetchData);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-[590] text-bsb-text-primary">试剂管理</h1>

        <div v-if="reagents.length > 0" class="space-y-3">
            <Card
                v-for="reagent in reagents"
                :key="reagent.id"
                class="reagent-card border-bsb-border-standard bg-bsb-bg-panel"
            >
                <CardHeader class="flex flex-row items-center justify-between py-3">
                    <CardTitle class="text-sm text-bsb-text-primary">{{ reagent.name }}</CardTitle>
                    <div class="flex items-center gap-2">
                        <Badge variant="outline" class="text-bsb-text-tertiary">
                            {{ reagent.position }}
                        </Badge>
                        <Badge class="bg-bsb-bg-surface text-bsb-text-quaternary">
                            {{ getBoxName(reagent.boxId) }}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent v-if="reagent.description" class="pt-0">
                    <p class="text-xs text-bsb-text-quaternary">{{ reagent.description }}</p>
                </CardContent>
            </Card>
        </div>

        <p v-if="reagents.length === 0" class="text-sm text-bsb-text-quaternary">
            暂无试剂数据
        </p>
    </div>
</template>
