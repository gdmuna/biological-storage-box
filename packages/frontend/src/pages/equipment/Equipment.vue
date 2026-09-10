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
            path: '/main/equipment/overview',
        },
    },
    {
        id: 'list',
        value: {
            disabled: false,
            label: '设备列表',
            path: '/main/equipment/list',
        },
    },
]);
</script>

<style scoped></style>
