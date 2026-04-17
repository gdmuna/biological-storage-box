<script lang="ts">
export const description = 'A sidebar that collapses to icons.';
export const iframeHeight = '800px';
export const containerClass = 'w-full h-full';
</script>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppSidebar from '@/components/AppSidebar.vue';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
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

const navData = [
    { title: '仪表盘', url: '/dashboard' },
    { title: '库室', url: '/room' },
    { title: '储存盒', url: '/box' },
    { title: '试剂', url: '/reagent' },
    { title: '节点图', url: '/node' },
    { title: '组织', url: '/org' },
    { title: '个人中心', url: '/user' }
];

const activeNavData = computed(() => {
    const path = route.path;
    const idx = navData.findIndex((item) => path.startsWith(item.url));
    if (idx === -1) return null;
    return navData[idx];
});
</script>

<template>
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 h-6 my-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem class="hidden md:block">
                                <BreadcrumbLink href="https://github.com/gdmuna/biological-storage-box" rel="noreferer noopener" target="_blank">Biological-Storage-Box</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator class="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{{ activeNavData?.title }}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <main id="main-content" class="flex-1 overflow-y-auto bg-bsb-bg-marketing p-6">
                <RouterView />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>
