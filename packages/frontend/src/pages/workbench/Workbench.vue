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
            path: '/main/workbench/overview',
        },
    },
    {
        id: 'my-tasks',
        value: {
            disabled: false,
            label: '我的待办',
            path: '/main/workbench/my-task',
        },
    },
    {
        id: 'pending-approvals',
        value: {
            disabled: false,
            label: '待审批',
            path: '/main/workbench/pending-approval',
        },
    },
    {
        id: 'exceptions-alerts',
        value: {
            disabled: false,
            label: '异常与提醒',
            path: '/main/workbench/exception-alert',
        },
    },
]);
</script>

<style scoped></style>
