<script setup lang="ts">
import { computed, markRaw } from 'vue';

import { SidebarProps } from '@/components/ui/sidebar';

import NavMain from '@/components/NavMain.vue';
// import NavProjects from '@/components/NavProjects.vue';
import NavUser from '@/components/NavUser.vue';
import TeamSwitcher from '@/components/TeamSwitcher.vue';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import orgDefaultLogo from '@/components/icon/orgDefaultLogo.vue';

import { LayoutDashboard, Box, Building2, FlaskConical, Network, Home, Frame, Map, PieChart } from 'lucide-vue-next';

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
    console.log('Computed orgsData:', data);
    return data;
});

// This is sample data.
const data = {
    navMain: [
        { title: '仪表盘', url: '/dashboard', icon: LayoutDashboard },
        { title: '库室', url: '/room', icon: Home },
        { title: '储存盒', url: '/box', icon: Box },
        { title: '试剂', url: '/reagent', icon: FlaskConical },
        { title: '节点图', url: '/node', icon: Network },
        { title: '组织', url: '/org', icon: Building2 }
    ],
    projects: [
        {
            name: 'Design Engineering',
            url: '#',
            icon: Frame
        },
        {
            name: 'Sales & Marketing',
            url: '#',
            icon: PieChart
        },
        {
            name: 'Travel',
            url: '#',
            icon: Map
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
            <NavMain :items="data.navMain" />
            <!-- <NavProjects :projects="data.projects" /> -->
        </SidebarContent>
        <SidebarFooter>
            <NavUser :user="userData" />
        </SidebarFooter>
        <SidebarRail />
    </Sidebar>
</template>
