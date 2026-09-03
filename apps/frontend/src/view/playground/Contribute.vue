<template>
    <UseStableSlot name="sidebar.content">
        <SidebarGroup>
            <SidebarGroupLabel>Playground</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="WorkbenchPlayground" class="cursor-pointer" @click="handlePush">
                        <Radar />
                        <span>WorkbenchPlayground</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    </UseStableSlot>
    <UseStableSlot name="sidebarContent"></UseStableSlot>
</template>

<script setup lang="ts">
import { UseStableSlot, useViewHistory, useTabComponent, useTab } from '@/composables';

import { Radar } from '@lucide/vue';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

const { syncPush } = useViewHistory();

const { activeTabId } = useTab();

const { setCreateTabRule, withSwitching } = useTabComponent();

setCreateTabRule(/^\/workbench\/playground$/);

function handlePush() {
    withSwitching(() => syncPush(activeTabId, '/workbench/playground'));
}
</script>

<style scoped></style>
