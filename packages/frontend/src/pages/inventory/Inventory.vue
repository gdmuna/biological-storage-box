<template>
    <RouterTabBar class="border-b" />
    <ScrollArea type="auto" class="min-h-0 scroll-smooth">
        <RouterView />
    </ScrollArea>
</template>

<script setup lang="ts">
import { RouterTabBar, useRouteTab } from '@/modules';
import { ScrollArea } from '@/ui/scroll-area';

const { setEntity } = useRouteTab();

setEntity([
    {
        id: 'overview',
        value: {
            disabled: false,
            label: '概览',
            path: '/main/inventory/overview',
        },
    },
    {
        id: 'ledger',
        value: {
            disabled: false,
            label: '台账',
            path: '/main/inventory/ledger',
        },
    },
    {
        id: 'storage-topology',
        value: {
            disabled: false,
            label: '存储拓扑',
            path: '/main/inventory/storage-topology',
        },
    },
    {
        id: 'stocktake',
        value: {
            disabled: false,
            label: '盘点',
            path: '/main/inventory/stocktake',
        },
    },
]);
</script>

<style scoped></style>
