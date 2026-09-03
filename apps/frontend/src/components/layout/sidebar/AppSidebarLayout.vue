<template>
    <SidebarProvider>
        <Sidebar v-bind="props">
            <SidebarHeader>
                <!-- <TeamSwitcher :teams="data.teams" /> -->
                <UseSlotTarget name="sidebar.header" />
            </SidebarHeader>
            <SidebarContent>
                <!-- <NavMain :items="data.navMain" />
                    <NavProjects :projects="data.projects" /> -->
                <UseSlotTarget name="sidebar.content" />
            </SidebarContent>
            <SidebarFooter>
                <!-- <NavUser :user="data.user" /> -->
                <UseSlotTarget name="sidebar.footer" />
            </SidebarFooter>
        </Sidebar>
        <SidebarInset class="min-w-0 max-h-screen">
            <!-- <header
                class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                        <BreadcrumbItem class="hidden md:block">
                            <BreadcrumbLink href="#">
                            Building Your Application
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator class="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                        </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header> -->
            <!-- <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div class="grid auto-rows-min gap-4 md:grid-cols-3">
                <div class="bg-muted/50 aspect-video rounded-xl" />
                <div class="bg-muted/50 aspect-video rounded-xl" />
                <div class="bg-muted/50 aspect-video rounded-xl" />
                </div>
                <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </div> -->
            <slot />
            <!-- <UseSlot name="app-sidebar-layout">
                <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div class="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div class="bg-muted/50 aspect-video rounded-xl" />
                    <div class="bg-muted/50 aspect-video rounded-xl" />
                    <div class="bg-muted/50 aspect-video rounded-xl" />
                </div>
                <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
                </div>
            </UseSlot> -->
            <!-- <UseSlot name="app-sidebar-menu">
                <div class="p-4">
                <p class="text-sm text-muted-foreground">
                    这是一个按理来说在上面的Slot
                    TimeStamep: {{ timestamp }}
                </p>
                </div>
            </UseSlot>
            <UseStableSlot name="app-sidebar-menu" :opts="{ order: 10 }">
                <div class="p-4">
                <p class="text-sm text-muted-foreground">
                    This content is injected into the sidebar menu using the slot provider.
                    Timestamp: {{ timestamp }}
                </p>
                </div>
            </UseStableSlot> -->
        </SidebarInset>
    </SidebarProvider>
</template>

<script setup lang="ts">
// import AppSidebar from "@/components/AppSidebar.vue";
// import {
//     Breadcrumb,
//     BreadcrumbItem,
//     BreadcrumbLink,
//     BreadcrumbList,
//     BreadcrumbPage,
//     BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
import { Sidebar, SidebarInset, SidebarProvider, SidebarContent, SidebarFooter, SidebarHeader, type SidebarProps } from '@/components/ui/sidebar';

import { UseSlotTarget } from '@/composables';

const props = withDefaults(defineProps<SidebarProps>(), {
    collapsible: 'icon'
});
</script>
