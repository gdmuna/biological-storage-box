<script setup lang="ts">
import type { Component } from 'vue';

import { ChevronsUpDown, Plus } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useOrgStore } from '@/stores/org';

import { CreateOrgFormSchema } from '@/schemas/org.schema';

const props = defineProps<{
    teams: {
        id: string;
        name: string;
        logo: Component;
    }[];
}>();

const org = useOrgStore();

const { isMobile, setOpenMobile } = useSidebar();

const activeTeam = computed(() => {
    return props.teams.find((team) => team.id === org.currentOrgId) || null;
});

const dialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const createLoading = ref(false);
const createError = ref('');

async function handleCreate() {
    createError.value = '';
    const result = CreateOrgFormSchema.safeParse({
        name: newName.value,
        description: newDesc.value || undefined
    });
    if (!result.success) {
        createError.value = result.error.issues[0].message;
        return;
    }
    createLoading.value = true;
    try {
        await org.createAndSwitch(result.data);
        newName.value = '';
        newDesc.value = '';
        dialogOpen.value = false;
        setOpenMobile(false);
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        createLoading.value = false;
    }
}
</script>

<template>
    <SidebarMenu>
        <SidebarMenuItem>
            <DropdownMenu v-if="teams.length > 0">
                <DropdownMenuTrigger as-child>
                    <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground select-none" :disabled="!activeTeam">
                        <div class="flex aspect-square size-8 items-center justify-center rounded-lg border">
                            <component :is="activeTeam?.logo" class="size-6" />
                        </div>
                        <div class="grid flex-1 text-left text-sm leading-tight">
                            <span class="truncate font-medium">
                                {{ activeTeam?.name }}
                            </span>
                        </div>
                        <ChevronsUpDown class="ml-auto" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="start" :side="isMobile ? 'bottom' : 'right'" :side-offset="4">
                    <DropdownMenuLabel class="text-xs text-muted-foreground">组织</DropdownMenuLabel>
                    <DropdownMenuItem v-for="(team, index) in teams" :key="team.name" class="gap-2 p-2 truncate" @click="org.selectOrg(team.id)">
                        <div class="flex size-6 items-center justify-center rounded-sm border">
                            <component :is="team.logo" class="size-4 shrink-0" />
                        </div>
                        {{ team.name }}
                        <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="gap-2 p-2" @click="dialogOpen = true">
                        <Plus class="size-4" />
                        创建新组织
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <SidebarMenuButton v-else size="lg" @click="dialogOpen = true">
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg border">
                    <Plus class="size-6" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-medium">创建新组织</span>
                </div>
            </SidebarMenuButton>
            <Dialog v-model:open="dialogOpen">
                <DialogContent class="rounded-xl border-0 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                    <DialogHeader>
                        <DialogTitle class="font-display text-bsb-text-primary">创建新组织</DialogTitle>
                        <DialogDescription class="text-bsb-text-tertiary">输入组织名称和描述</DialogDescription>
                    </DialogHeader>
                    <form class="space-y-4" @submit.prevent="handleCreate">
                        <div class="space-y-2">
                            <Label class="text-bsb-text-secondary">名称</Label>
                            <Input v-model="newName" placeholder="组织名称" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                        </div>
                        <div class="space-y-2">
                            <Label class="text-bsb-text-secondary">描述</Label>
                            <Input v-model="newDesc" placeholder="可选描述" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                        </div>
                        <p v-if="createError" class="text-sm text-red-500">{{ createError }}</p>
                        <DialogFooter>
                            <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="createLoading">
                                {{ createLoading ? '创建中…' : '创建' }}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </SidebarMenuItem>
    </SidebarMenu>
</template>
