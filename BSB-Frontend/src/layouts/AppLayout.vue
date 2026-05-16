<script lang="ts"></script>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppSidebar from '@/components/sidebar/AppSidebar.vue';
import AppBreadcrumb from '@/components/breadcrumb/AppBreadcrumb.vue';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useOrgStore } from '@/stores/org';
import { pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const org = useOrgStore();

onMounted(() => {
    org.fetchOrgs();
});

watch(
    () => route.path,
    () => {
        const main = document.getElementById('main-content');
        if (main) pageTransitionIn(main);
    }
);
</script>

<template>
    <SidebarProvider id="sidebar-provider">
        <AppSidebar />
        <SidebarInset id="sidebar-inset">
            <header class="flex sticky top-0 z-10 bg-white border-b border-bsb-border-standard h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 h-6 my-auto" />
                    <AppBreadcrumb />
                </div>
            </header>
            <main id="main-content" class="bg-bsb-bg-marketing p-6 flex-1">
                <RouterView />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>
