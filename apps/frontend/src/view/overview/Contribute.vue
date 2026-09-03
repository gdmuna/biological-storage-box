<template>
    <UseStableSlot name="sidebar.content.default">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Overview" class="cursor-pointer" @click="handlePush">
                    <ChartLine />
                    <span>Overview</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    </UseStableSlot>
</template>

<script setup lang="ts">
import { UseStableSlot, useTab, useTabComponent, useViewHistory } from '@/composables';

import { ChartLine } from '@lucide/vue';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

const { syncPush } = useViewHistory();

const { activeTabId } = useTab();

const { setCreateTabRule, withSwitching } = useTabComponent();

setCreateTabRule(/^\/workbench\/overview$/);

function handlePush() {
    withSwitching(() => syncPush(activeTabId, '/workbench/overview'));
}
</script>

<style scoped></style>
