<script setup lang="ts">
import { computed, markRaw } from 'vue';

import { SidebarProps } from '@/components/ui/sidebar';

import NavMain from '@/components/sidebar/NavMain.vue';
import NavUser from '@/components/sidebar/NavUser.vue';
import TeamSwitcher from '@/components/sidebar/TeamSwitcher.vue';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import orgDefaultLogo from '@/components/icon/orgDefaultLogo.vue';

import { LayoutDashboard, Box, Building2, FlaskConical, Network, Home, Tag, ScrollText } from '@lucide/vue';

import { useAuthStore } from '@/stores/auth';
import { useOrgStore } from '@/stores/org';

const props = withDefaults(defineProps<SidebarProps>(), {
    variant: 'sidebar',
    collapsible: 'icon'
});

const auth = useAuthStore();
const org = useOrgStore();

const userData = computed(() => ({
    name: auth.user?.nickname || auth.user?.username || 'Unknown User',
    email: auth.user?.email || '',
    avatar: '/RhineLab.svg'
}));

const orgsData = computed(() => {
    const data = org.orgs.map((o) => ({
        id: o.id,
        name: o.name,
        logo: markRaw(orgDefaultLogo)
    }));
    return data;
});

const data = {
    navGroups: [
        {
            label: '概览',
            items: [
                { title: '仪表盘', url: '/dashboard', icon: LayoutDashboard },
                { title: '节点图', url: '/node', icon: Network }
            ]
        },
        {
            label: '库存管理',
            items: [
                { title: '库室', url: '/room', icon: Home },
                { title: '储存盒', url: '/box', icon: Box },
                { title: '试剂', url: '/reagent', icon: FlaskConical },
                { title: '试剂类型', url: '/reagent-type', icon: Tag }
            ]
        },
        {
            label: '分析与记录',
            items: [
                { title: '操作日志', url: '/logs', icon: ScrollText },
                { title: '组织', url: '/org', icon: Building2 }
            ]
        }
    ]
};
</script>

<template>
    <Sidebar v-bind="props">
        <SidebarHeader>
            <TeamSwitcher :teams="orgsData" />
        </SidebarHeader>
        <SidebarContent>
            <NavMain :groups="data.navGroups" />
        </SidebarContent>
        <SidebarFooter>
            <NavUser :user="userData" />
        </SidebarFooter>
        <SidebarRail />
    </Sidebar>
</template>
