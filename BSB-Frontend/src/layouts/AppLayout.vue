<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import {
    LayoutDashboard,
    Box,
    Building2,
    User,
    FlaskConical,
    LogOut,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    { path: '/reagent', label: '试剂', icon: FlaskConical },
    { path: '/org', label: '组织', icon: Building2 },
    { path: '/user', label: '个人', icon: User },
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
    },
);

async function handleLogout() {
    await auth.doLogout();
    router.push('/login');
}
</script>

<template>
    <div class="flex h-screen w-screen overflow-hidden bg-bsb-bg-marketing">
        <!-- Sidebar -->
        <aside
            class="flex flex-col border-r border-bsb-border-standard bg-bsb-bg-panel transition-all duration-200"
            :class="ui.sidebarCollapsed ? 'w-16' : 'w-60'"
        >
            <!-- Logo -->
            <div class="flex h-12 items-center gap-2 px-4">
                <Box class="size-5 shrink-0 text-bsb-accent-brand" />
                <span
                    v-if="!ui.sidebarCollapsed"
                    class="truncate text-sm font-[590] text-bsb-text-primary"
                >
                    BSB
                </span>
            </div>

            <Separator class="bg-bsb-border-standard" />

            <!-- Nav items -->
            <nav class="flex-1 space-y-1 p-2">
                <TooltipProvider :delay-duration="0">
                    <Tooltip v-for="item in navItems" :key="item.path">
                        <TooltipTrigger as-child>
                            <RouterLink
                                :to="item.path"
                                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                                :class="
                                    route.path.startsWith(item.path)
                                        ? 'bg-bsb-bg-surface text-bsb-text-primary'
                                        : 'text-bsb-text-tertiary hover:bg-bsb-bg-surface hover:text-bsb-text-secondary'
                                "
                            >
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

            <!-- Bottom area -->
            <div class="p-2">
                <Button
                    variant="ghost"
                    size="icon"
                    class="w-full text-bsb-text-quaternary hover:text-bsb-text-secondary"
                    @click="ui.toggleSidebar()"
                >
                    <PanelLeftClose v-if="!ui.sidebarCollapsed" class="size-4" />
                    <PanelLeft v-else class="size-4" />
                </Button>
            </div>
        </aside>

        <!-- Main area -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Top bar -->
            <header
                class="flex h-12 shrink-0 items-center justify-between border-b border-bsb-border-standard px-4"
            >
                <div class="text-sm text-bsb-text-tertiary">
                    {{ org.currentOrg?.name ?? '未选择组织' }}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="sm" class="gap-2">
                            <Avatar class="size-6">
                                <AvatarFallback
                                    class="bg-bsb-accent-brand/20 text-xs text-bsb-accent-brand"
                                >
                                    {{ initials }}
                                </AvatarFallback>
                            </Avatar>
                            <span
                                v-if="auth.user"
                                class="text-sm text-bsb-text-secondary"
                            >
                                {{ auth.user.nickname || auth.user.username }}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                        <DropdownMenuItem @click="router.push('/user')">
                            <User class="mr-2 size-4" />
                            个人设置
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            class="text-red-400"
                            @click="handleLogout"
                        >
                            <LogOut class="mr-2 size-4" />
                            退出登录
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <!-- Content -->
            <main
                id="main-content"
                class="flex-1 overflow-y-auto p-6"
            >
                <RouterView />
            </main>
        </div>
    </div>
</template>
