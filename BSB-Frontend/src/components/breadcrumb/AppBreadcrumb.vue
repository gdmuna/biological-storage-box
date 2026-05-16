<template>
    <div>
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem class="hidden md:block">
                    <BreadcrumbLink href="/dashboard">首页</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator class="hidden md:block" />
                <BreadcrumbItem>
                    <BreadcrumbPage>{{ activeNavData?.title }}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    </div>
</template>

<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

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

<style scoped></style>
