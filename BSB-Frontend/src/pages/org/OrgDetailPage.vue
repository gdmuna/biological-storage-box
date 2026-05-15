<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Users, Share2, Settings, Trash2, Search, UserPlus, X } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useOrgStore } from '@/stores/org';
import { useAuthStore } from '@/stores/auth';
import { getOrg, deleteOrg, updateOrgFull } from '@/api/modules/org';
import { listOrgMembers, inviteUser, removeMember } from '@/api/modules/org-user';
import { listOutboundShares, listInboundShares, type ShareRecord } from '@/api/modules/share';
import type { Org, OrgMember } from '@/schemas/org.schema';
import { pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const router = useRouter();
const org = useOrgStore();
const auth = useAuthStore();

const orgId = computed(() => route.params.id as string);

type TabKey = 'members' | 'shares' | 'settings';
const activeTab = ref<TabKey>('members');

const orgData = ref<Org | null>(null);
const members = ref<OrgMember[]>([]);
const outboundShares = ref<ShareRecord[]>([]);
const inboundShares = ref<ShareRecord[]>([]);

const memberSearch = ref('');
const memberSearchResults = ref<{ user: { id: string; username: string; nickname: string; email: string }; role: string }[]>([]);
const inviteId = ref('');
const inviteLoading = ref(false);
const inviteError = ref('');

const settingsName = ref('');
const settingsDesc = ref('');
const settingsPublic = ref(false);
const settingsSaving = ref(false);

const deleteDialogOpen = ref(false);

const isAdminOrOwner = computed(() => {
    const m = members.value.find((m) => m.userId === auth.user?.id);
    return m?.role === 'OWNER' || m?.role === 'ADMIN';
});

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);

    try {
        [orgData.value, members.value] = await Promise.all([getOrg(orgId.value).send(), listOrgMembers(orgId.value).send()]);
        settingsName.value = orgData.value.name;
        settingsDesc.value = orgData.value.description ?? '';
        settingsPublic.value = (orgData.value as any).isPublic ?? false;

        [outboundShares.value, inboundShares.value] = await Promise.all([listOutboundShares(orgId.value).send(), listInboundShares(orgId.value).send()]);
    } catch {
        /* empty */
    }
});

async function handleMemberSearch() {
    if (!memberSearch.value.trim()) return;
    memberSearchResults.value = await org.searchMembers(orgId.value, memberSearch.value.trim());
}

async function handleInvite() {
    if (!inviteId.value.trim()) return;
    inviteLoading.value = true;
    inviteError.value = '';
    try {
        await inviteUser({ orgId: orgId.value, userId: inviteId.value.trim() }).send();
        inviteId.value = '';
    } catch (e: unknown) {
        inviteError.value = e instanceof Error ? e.message : '邀请失败';
    } finally {
        inviteLoading.value = false;
    }
}

async function handleRemoveMember(userId: string) {
    try {
        await removeMember({ orgId: orgId.value, userId }).send();
        members.value = await listOrgMembers(orgId.value).send();
    } catch {
        /* empty */
    }
}

async function handleSaveSettings() {
    settingsSaving.value = true;
    try {
        await updateOrgFull({
            orgId: orgId.value,
            name: settingsName.value,
            description: settingsDesc.value || undefined,
            isPublic: settingsPublic.value
        }).send();
        if (orgData.value) orgData.value.name = settingsName.value;
        await org.fetchOrgs();
    } catch {
        /* empty */
    } finally {
        settingsSaving.value = false;
    }
}

async function handleDelete() {
    try {
        await deleteOrg(orgId.value).send();
        await org.fetchOrgs();
        router.push('/org');
    } catch {
        /* empty */
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <Button variant="ghost" size="icon" class="shrink-0 text-bsb-text-tertiary hover:text-bsb-text-primary" @click="router.push('/org')">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">{{ orgData?.name ?? '加载中…' }}</h1>
                <p v-if="orgData?.description" class="mt-0.5 text-sm text-bsb-text-tertiary">{{ orgData.description }}</p>
            </div>
            <Badge v-if="(orgData as any)?.isPublic" variant="outline" class="ml-auto text-xs text-bsb-accent-brand border-bsb-accent-brand/30">公开</Badge>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 border-b border-bsb-border-standard">
            <button
                v-for="tab in [
                    { key: 'members', label: '成员', icon: Users },
                    { key: 'shares', label: '共享', icon: Share2 },
                    { key: 'settings', label: '设置', icon: Settings }
                ] as const"
                :key="tab.key"
                class="flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
                :class="activeTab === tab.key ? 'border-bsb-text-primary text-bsb-text-primary' : 'border-transparent text-bsb-text-tertiary hover:text-bsb-text-secondary'"
                @click="activeTab = tab.key">
                <component :is="tab.icon" class="size-3.5" />
                {{ tab.label }}
            </button>
        </div>

        <!-- Members Tab -->
        <template v-if="activeTab === 'members'">
            <div class="space-y-4">
                <div class="flex gap-2">
                    <div class="relative flex-1 max-w-sm">
                        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
                        <Input v-model="memberSearch" placeholder="搜索成员…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10" @keyup.enter="handleMemberSearch" />
                    </div>
                    <Button variant="outline" size="sm" class="border-bsb-border-standard text-bsb-text-secondary" @click="handleMemberSearch">搜索</Button>
                    <Dialog v-if="isAdminOrOwner">
                        <DialogTrigger as-child>
                            <Button size="sm" class="gap-1.5 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                                <UserPlus class="size-4" />
                                邀请
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>邀请成员</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-3">
                                <Label>用户 ID</Label>
                                <Input v-model="inviteId" placeholder="输入用户 ID…" />
                                <p v-if="inviteError" class="text-xs text-red-500">{{ inviteError }}</p>
                            </div>
                            <DialogFooter>
                                <Button :disabled="inviteLoading" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleInvite">
                                    {{ inviteLoading ? '邀请中…' : '发送邀请' }}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div v-if="memberSearchResults.length > 0" class="rounded-lg border border-bsb-border-standard bg-bsb-bg-surface p-3 space-y-2">
                    <p class="text-xs text-bsb-text-tertiary">搜索结果</p>
                    <div v-for="r in memberSearchResults" :key="r.user.id" class="flex items-center justify-between py-1">
                        <div>
                            <span class="text-sm font-medium text-bsb-text-primary">{{ r.user.nickname || r.user.username }}</span>
                            <span class="ml-2 text-xs text-bsb-text-tertiary">{{ r.user.email }}</span>
                        </div>
                        <Badge variant="outline" class="text-xs">{{ r.role }}</Badge>
                    </div>
                </div>

                <div class="divide-y divide-bsb-border-standard rounded-lg border border-bsb-border-standard bg-white">
                    <div v-for="m in members" :key="m.userId" class="flex items-center justify-between px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="flex size-8 items-center justify-center rounded-full bg-[#f2f9ff] text-xs font-semibold text-[#097fe8]">
                                {{ (m.user?.nickname || m.user?.username || '?').slice(0, 2).toUpperCase() }}
                            </div>
                            <div>
                                <p class="text-sm font-medium text-bsb-text-primary">{{ m.user?.nickname || m.user?.username }}</p>
                                <p class="text-xs text-bsb-text-tertiary">{{ m.user?.email }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Badge variant="outline" class="text-xs">{{ m.role }}</Badge>
                            <Button v-if="isAdminOrOwner && m.role !== 'OWNER'" variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleRemoveMember(m.userId)">
                                <X class="size-3.5" />
                            </Button>
                        </div>
                    </div>
                    <p v-if="members.length === 0" class="px-4 py-6 text-center text-sm text-bsb-text-quaternary">暂无成员</p>
                </div>
            </div>
        </template>

        <!-- Shares Tab -->
        <template v-else-if="activeTab === 'shares'">
            <div class="space-y-6">
                <div>
                    <h3 class="mb-3 text-sm font-emphasis text-bsb-text-secondary">已共享给他人</h3>
                    <div class="divide-y divide-bsb-border-standard rounded-lg border border-bsb-border-standard bg-white">
                        <div v-for="s in outboundShares" :key="s.id" class="flex items-center justify-between px-4 py-3">
                            <div>
                                <p class="text-sm font-medium text-bsb-text-primary">资源 {{ s.resourceId.slice(0, 8) }}…</p>
                                <p class="text-xs text-bsb-text-tertiary">→ {{ s.granteeOrg?.name }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <Badge variant="outline" class="text-xs">{{ s.permission }}</Badge>
                                <Badge variant="outline" :class="s.status === 'ACTIVE' ? 'border-green-200 text-green-700' : 'text-bsb-text-quaternary'">{{ s.status }}</Badge>
                            </div>
                        </div>
                        <p v-if="outboundShares.length === 0" class="px-4 py-6 text-center text-sm text-bsb-text-quaternary">暂未向其他组织共享资源</p>
                    </div>
                </div>
                <div>
                    <h3 class="mb-3 text-sm font-emphasis text-bsb-text-secondary">获得的共享</h3>
                    <div class="divide-y divide-bsb-border-standard rounded-lg border border-bsb-border-standard bg-white">
                        <div v-for="s in inboundShares" :key="s.id" class="flex items-center justify-between px-4 py-3">
                            <div>
                                <p class="text-sm font-medium text-bsb-text-primary">资源 {{ s.resourceId.slice(0, 8) }}…</p>
                                <p class="text-xs text-bsb-text-tertiary">← {{ (s as any).ownerOrg?.name }}</p>
                            </div>
                            <Badge variant="outline" class="text-xs">{{ s.permission }}</Badge>
                        </div>
                        <p v-if="inboundShares.length === 0" class="px-4 py-6 text-center text-sm text-bsb-text-quaternary">暂无获得的共享资源</p>
                    </div>
                </div>
            </div>
        </template>

        <!-- Settings Tab -->
        <template v-else-if="activeTab === 'settings'">
            <div class="max-w-md space-y-5">
                <div class="space-y-1.5">
                    <Label for="settings-name" class="text-sm font-medium text-bsb-text-primary">组织名称</Label>
                    <Input id="settings-name" v-model="settingsName" class="border-bsb-border-standard" />
                </div>
                <div class="space-y-1.5">
                    <Label for="settings-desc" class="text-sm font-medium text-bsb-text-primary">描述</Label>
                    <Input id="settings-desc" v-model="settingsDesc" class="border-bsb-border-standard" />
                </div>
                <div class="flex items-center justify-between rounded-lg border border-bsb-border-standard bg-bsb-bg-surface px-4 py-3">
                    <div>
                        <p class="text-sm font-medium text-bsb-text-primary">公开可发现</p>
                        <p class="text-xs text-bsb-text-tertiary">允许其他用户在探索页面找到此组织</p>
                    </div>
                    <Switch v-model:checked="settingsPublic" />
                </div>
                <Button :disabled="settingsSaving" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleSaveSettings">
                    {{ settingsSaving ? '保存中…' : '保存设置' }}
                </Button>

                <Separator class="bg-bsb-border-standard" />

                <div class="rounded-lg border border-red-100 bg-red-50/50 p-4 space-y-3">
                    <p class="text-sm font-medium text-red-700">危险区域</p>
                    <p class="text-xs text-red-500">删除组织将永久移除所有数据，此操作不可逆。</p>
                    <Dialog v-model:open="deleteDialogOpen">
                        <DialogTrigger as-child>
                            <Button variant="outline" size="sm" class="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                <Trash2 class="mr-2 size-4" />
                                删除组织
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>确认删除组织？</DialogTitle>
                            </DialogHeader>
                            <p class="text-sm text-bsb-text-secondary">此操作不可撤销。组织下所有数据将被永久删除。</p>
                            <DialogFooter>
                                <Button variant="outline" @click="deleteDialogOpen = false">取消</Button>
                                <Button class="bg-red-600 text-white hover:bg-red-700" @click="handleDelete">确认删除</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </template>
    </div>
</template>
