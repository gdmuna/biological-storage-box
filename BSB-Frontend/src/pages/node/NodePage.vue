<script setup lang="ts">
import { useOrgStore } from '@/stores/org';
import NodeCanvas from '@/components/node/NodeCanvas.vue';

const org = useOrgStore();
</script>

<template>
    <NodeCanvas v-if="org.currentOrgId" :org-id="org.currentOrgId" />
    <div v-else class="flex items-center justify-center p-8">
        <p class="text-sm text-bsb-text-secondary">请先选择组织</p>
    </div>
</template>
