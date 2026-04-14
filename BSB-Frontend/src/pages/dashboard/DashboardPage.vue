<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Box, Building2, FlaskConical } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrgStore } from '@/stores/org';
import { listBoxes } from '@/api/modules/box';
import { fadeSlideIn } from '@/utils/animation';

const org = useOrgStore();
const boxCount = ref(0);

onMounted(async () => {
    fadeSlideIn('.dashboard-card');
    if (org.currentOrgId) {
        try {
            const boxes = await listBoxes(org.currentOrgId).send();
            boxCount.value = Array.isArray(boxes) ? boxes.length : 0;
        } catch {
            /* empty */
        }
    }
});
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-[590] text-bsb-text-primary">仪表盘</h1>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card class="dashboard-card border-bsb-border-standard bg-bsb-bg-panel">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-[510] text-bsb-text-secondary">储存盒</CardTitle>
                    <Box class="size-4 text-bsb-text-quaternary" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-[590] text-bsb-text-primary">{{ boxCount }}</div>
                </CardContent>
            </Card>

            <Card class="dashboard-card border-bsb-border-standard bg-bsb-bg-panel">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-[510] text-bsb-text-secondary">组织</CardTitle>
                    <Building2 class="size-4 text-bsb-text-quaternary" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-[590] text-bsb-text-primary">{{ org.orgs.length }}</div>
                </CardContent>
            </Card>

            <Card class="dashboard-card border-bsb-border-standard bg-bsb-bg-panel">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-[510] text-bsb-text-secondary">试剂</CardTitle>
                    <FlaskConical class="size-4 text-bsb-text-quaternary" />
                </CardHeader>
                <CardContent>
                    <div class="text-sm text-bsb-text-tertiary">选择储存盒查看</div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
