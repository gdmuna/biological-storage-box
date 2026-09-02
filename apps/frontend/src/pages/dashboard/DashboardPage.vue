<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Box, Building2, FlaskConical } from '@lucide/vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrgStore } from '@/stores/org';
import { useAuthStore } from '@/stores/auth';
import { useNodeStore } from '@/stores/node';
import { useReagentStore } from '@/stores/reagent';
import { fadeSlideIn } from '@/utils/animation';
import NodeCanvas from '@/components/node/NodeCanvas.vue';

const org = useOrgStore();
const auth = useAuthStore();
const nodeStore = useNodeStore();
const reagentStore = useReagentStore();
const boxCount = ref(0);

onMounted(async () => {
    fadeSlideIn('.dashboard-card');
    await org.fetchOrgs();
});

watch(
    () => org.currentOrgId,
    async (orgId) => {
        if (!orgId) {
            boxCount.value = 0;
            return;
        }
        await nodeStore.fetchByOrg(orgId, true);
        boxCount.value = nodeStore.boxNodes.length;
        await reagentStore.initData(orgId, true);
    },
    { immediate: true }
);
</script>

<template>
    <div class="space-y-6">
        <!-- Welcome header -->
        <div>
            <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">欢迎回来，{{ auth.user?.nickname ?? auth.user?.username ?? '用户' }}</h1>
            <p class="mt-1 text-sm text-bsb-text-tertiary">以下是您当前组织的概况。</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Box count card -->
            <Card class="dashboard-card rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-medium text-bsb-text-secondary">储存盒</CardTitle>
                    <div class="flex size-8 items-center justify-center rounded-lg bg-bsb-card-tint-sky">
                        <Box class="size-4 text-bsb-accent-brand" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="text-3xl font-bold text-bsb-text-primary">{{ boxCount }}</div>
                </CardContent>
            </Card>

            <!-- Org count card -->
            <Card class="dashboard-card rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-medium text-bsb-text-secondary">所属组织</CardTitle>
                    <div class="flex size-8 items-center justify-center rounded-lg bg-bsb-card-tint-mint">
                        <Building2 class="size-4 text-[#2f9e44]" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="text-3xl font-bold text-bsb-text-primary">{{ org.orgs.length }}</div>
                </CardContent>
            </Card>

            <!-- Reagent card -->
            <Card class="dashboard-card rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardHeader class="flex flex-row items-center justify-between pb-2">
                    <CardTitle class="text-sm font-medium text-bsb-text-secondary">试剂</CardTitle>
                    <div class="flex size-8 items-center justify-center rounded-lg bg-bsb-card-tint-peach">
                        <FlaskConical class="size-4 text-[#e8590c]" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="text-3xl font-bold text-bsb-text-primary">{{ reagentStore.reagents.length }}</div>
                </CardContent>
            </Card>
        </div>

        <!-- Node Canvas 缩略版 -->
        <div v-if="org.currentOrgId" class="space-y-3">
            <h2 class="text-sm font-emphasis text-bsb-text-secondary">节点关系图</h2>
            <div class="overflow-hidden rounded-xl border border-bsb-border-standard">
                <NodeCanvas :org-id="org.currentOrgId" height="400px" :compact="true" />
            </div>
        </div>
    </div>
</template>
