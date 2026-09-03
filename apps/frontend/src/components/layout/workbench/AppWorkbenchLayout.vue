<template>
    <AppSidebarLayout>
        <header class="sticky top-0 bg-neutral-100 border-b">
            <div class="flex">
                <div class="sticky left-0 flex items-center z-10 p-1 bg-neutral-100">
                    <SidebarTrigger class="hover:bg-neutral-200" />
                    <ViewHistoryNavigateTrigger :contextId="activeTabId">
                        <template #back>
                            <ChevronLeft />
                        </template>
                        <template #forward>
                            <ChevronRight />
                        </template>
                    </ViewHistoryNavigateTrigger>
                </div>
                <TabBar class="min-w-0 bg-neutral-100" />
                <div class="sticky right-0 flex items-center z-10 p-1 bg-neutral-100">
                    <TabBarCreateTrigger />
                </div>
            </div>
        </header>
        <UseStableSlot name="sidebar.content">
            <SidebarGroup>
                <UseSlotTarget name="sidebar.content.default" />
            </SidebarGroup>
        </UseStableSlot>
        <Contribute />
        <ScrollArea type="auto" class="overflow-y-auto scroll-smooth">
            <RouterView v-slot="{ Component }">
                <TabHost :Component />
            </RouterView>
        </ScrollArea>
    </AppSidebarLayout>
</template>

<script setup lang="ts">
import AppSidebarLayout from '@/components/layout/sidebar/AppSidebarLayout.vue';
import Contribute from '@/view/ContributeWorkbench.vue';

import { UseStableSlot, UseSlotTarget, TabHost, ViewHistoryNavigateTrigger, useTitle, useTab } from '@/composables';

import { SidebarGroup, SidebarTrigger } from '@/components/ui/sidebar';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { TabBar, TabBarCreateTrigger } from '@/modules/tabBar';

import { useTitle as _useTitle } from '@vueuse/core';

import { ChevronLeft, ChevronRight } from '@lucide/vue';

const { title } = useTitle();
_useTitle(title);

const { activeTabId } = useTab();
</script>

<style scoped></style>
