<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { LayoutDashboard, Box, Building2, User, FlaskConical, LogOut, PanelLeftClose, PanelLeft, MapPin, Home, Check, ChevronDown } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/auth';
import { useOrgStore } from '@/stores/org';
import { useUiStore } from '@/stores/ui';
import { pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const org = useOrgStore();
const ui = useUiStore();

const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
    { path: '/box', label: '储存盒', icon: Box },
    { path: '/room', label: '房间', icon: Home },
    { path: '/node', label: '节点管理', icon: MapPin },
    { path: '/reagent', label: '试剂', icon: FlaskConical },
    { path: '/org', label: '组织', icon: Building2 },
    { path: '/user', label: '个人', icon: User }
];

const initials = computed(() => {
    const name = auth.user?.nickname || auth.user?.username || '?';
    return name.slice(0, 2).toUpperCase();
});

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

async function handleLogout() {
    await auth.doLogout();
    router.push('/login');
}
</script>

<template>
    <div class="flex h-screen w-screen overflow-hidden bg-bsb-bg-marketing">
        <!-- Sidebar — Notion warm white -->
        <aside class="flex flex-col border-r border-bsb-border-standard bg-bsb-bg-surface transition-all duration-200" :class="ui.sidebarCollapsed ? 'w-16' : 'w-60'">
            <!-- Logo -->
            <div class="flex h-12 items-center gap-2.5 px-4">
                <img src="/icons/logo.svg" class="size-5 shrink-0" alt="BSB" />
                <span v-if="!ui.sidebarCollapsed" class="truncate font-display text-[15px] font-bold tracking-tight text-bsb-text-primary">Biological-Storage-Box</span>
            </div>

            <Separator class="bg-bsb-border-standard" />

            <!-- Nav items -->
            <nav class="flex-1 space-y-0.5 p-2">
                <TooltipProvider :delay-duration="0">
                    <Tooltip v-for="item in navItems" :key="item.path">
                        <TooltipTrigger as-child>
                            <RouterLink
                                :to="item.path"
                                class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150"
                                :class="route.path.startsWith(item.path) ? 'bg-white text-bsb-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[rgba(0,0,0,0.08)]' : 'text-bsb-text-tertiary hover:bg-[rgba(0,0,0,0.04)] hover:text-bsb-text-secondary'">
                                <component :is="item.icon" class="size-4 shrink-0" />
                                <span v-if="!ui.sidebarCollapsed">{{ item.label }}</span>
                            </RouterLink>
                        </TooltipTrigger>
                        <TooltipContent v-if="ui.sidebarCollapsed" side="right">
                            {{ item.label }}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </nav>

            <!-- Collapse toggle -->
            <div class="border-t border-bsb-border-standard p-2">
                <Button variant="ghost" size="icon" class="w-full text-bsb-text-quaternary hover:bg-[rgba(0,0,0,0.04)] hover:text-bsb-text-secondary" @click="ui.toggleSidebar()">
                    <PanelLeftClose v-if="!ui.sidebarCollapsed" class="size-4" />
                    <PanelLeft v-else class="size-4" />
                </Button>
            </div>
        </aside>

        <!-- Main area -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Top bar — pure white with whisper border -->
            <header class="flex h-12 shrink-0 items-center justify-between border-b border-bsb-border-standard bg-white px-5">
                <!-- Current org selector -->
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="sm" class="gap-1.5 rounded-md px-2 hover:bg-bsb-bg-surface">
                            <span class="text-sm font-medium text-bsb-text-secondary">
                                {{ org.currentOrg?.name ?? '未选择组织' }}
                            </span>
                            <ChevronDown class="size-3.5 text-bsb-text-quaternary" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" class="w-48">
                        <DropdownMenuItem v-for="o in org.orgs" :key="o.id" class="flex items-center justify-between" @click="org.selectOrg(o.id)">
                            <span>{{ o.name }}</span>
                            <Check v-if="o.id === org.currentOrgId" class="size-3.5 text-bsb-accent-brand" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="sm" class="gap-2 rounded-md px-2 hover:bg-bsb-bg-surface">
                            <Avatar class="size-6">
                                <AvatarFallback class="bg-[#f2f9ff] text-xs font-semibold text-[#097fe8]">
                                    {{ initials }}
                                </AvatarFallback>
                            </Avatar>
                            <span v-if="auth.user" class="text-sm font-medium text-bsb-text-primary">
                                {{ auth.user.nickname || auth.user.username }}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                        <DropdownMenuItem @click="router.push('/user')">
                            <User class="mr-2 size-4" />
                            个人设置
                        </DropdownMenuItem>
                        <DropdownMenuItem class="text-red-500" @click="handleLogout">
                            <LogOut class="mr-2 size-4" />
                            退出登录
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <!-- Content -->
            <main id="main-content" class="flex-1 overflow-y-auto bg-bsb-bg-marketing p-6">
                <RouterView />
            </main>
        </div>
    </div>
</template>
