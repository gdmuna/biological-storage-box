<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Trash2, UserMinus, UserCog, UserPlus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOrgStore } from '@/stores/org';
import { deleteOrg } from '@/api/modules/org';
import { listOrgMembers, listPendingOrgUsers, removeMember, acceptApply, rejectApply, inviteUser, updateMemberAuthority, quitOrg } from '@/api/modules/org-user';
import { CreateOrgFormSchema } from '@/schemas/org.schema';
import type { Org, OrgMember, PendingOrgUser } from '@/schemas/org.schema';
import { useAuthStore } from '@/stores/auth';

const org = useOrgStore();
const auth = useAuthStore();
const router = useRouter();

type PageTab = 'orgs' | 'members' | 'pending';
const activeTab = ref<PageTab>('orgs');

// Create org
const newName = ref('');
const newDesc = ref('');
const createError = ref('');
const createLoading = ref(false);
const dialogOpen = ref(false);

// Members
const members = ref<OrgMember[]>([]);
const pending = ref<PendingOrgUser[]>([]);
const membersLoading = ref(false);

// Invite
const inviteUserId = ref('');
const inviteError = ref('');
const inviteLoading = ref(false);
const inviteDialogOpen = ref(false);

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
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        createLoading.value = false;
    }
}

async function handleDelete(orgItem: Org) {
    try {
        await deleteOrg(orgItem.id).send();
        await org.fetchOrgs();
    } catch {
        /* empty */
    }
}

async function loadMembers() {
    if (!org.currentOrgId) return;
    membersLoading.value = true;
    try {
        [members.value, pending.value] = await Promise.all([listOrgMembers(org.currentOrgId).send(), listPendingOrgUsers(org.currentOrgId).send()]);
    } catch {
        /* empty */
    } finally {
        membersLoading.value = false;
    }
}

async function handleRemoveMember(member: OrgMember) {
    if (!org.currentOrgId) return;
    try {
        await removeMember({ orgId: org.currentOrgId, userId: member.userId }).send();
        await loadMembers();
    } catch {
        /* empty */
    }
}

async function handleAcceptApply(item: PendingOrgUser) {
    if (!org.currentOrgId) return;
    try {
        await acceptApply({ orgId: org.currentOrgId, userId: item.userId }).send();
        await loadMembers();
    } catch {
        /* empty */
    }
}

async function handleRejectApply(item: PendingOrgUser) {
    if (!org.currentOrgId) return;
    try {
        await rejectApply({ orgId: org.currentOrgId, userId: item.userId }).send();
        await loadMembers();
    } catch {
        /* empty */
    }
}

async function handleInvite() {
    if (!org.currentOrgId || !inviteUserId.value.trim()) return;
    inviteError.value = '';
    inviteLoading.value = true;
    try {
        await inviteUser({ orgId: org.currentOrgId, userId: inviteUserId.value.trim() }).send();
        inviteUserId.value = '';
        inviteDialogOpen.value = false;
    } catch (e: unknown) {
        inviteError.value = e instanceof Error ? e.message : '邀请失败';
    } finally {
        inviteLoading.value = false;
    }
}

async function handleUpdateRole(member: OrgMember, role: 'ADMIN' | 'MEMBER') {
    if (!org.currentOrgId) return;
    try {
        await updateMemberAuthority({ orgId: org.currentOrgId, userId: member.userId, role }).send();
        await loadMembers();
    } catch {
        /* empty */
    }
}

async function handleQuit(orgItem: Org) {
    try {
        await quitOrg(orgItem.id).send();
        await org.fetchOrgs();
    } catch {
        /* empty */
    }
}

function isOwner(orgItem: Org) {
    return orgItem.ownerId === auth.user?.id;
}

function currentUserRole(): OrgMember['role'] | null {
    const me = members.value.find((m) => m.userId === auth.user?.id);
    return me?.role ?? null;
}

function canManage() {
    const role = currentUserRole();
    return role === 'OWNER' || role === 'ADMIN';
}

function switchTab(tab: PageTab) {
    activeTab.value = tab;
    if ((tab === 'members' || tab === 'pending') && org.currentOrgId) {
        loadMembers();
    }
}

watch(
    () => org.currentOrgId,
    () => {
        if ((activeTab.value === 'members' || activeTab.value === 'pending') && org.currentOrgId) {
            loadMembers();
        }
    }
);

const roleLabelMap: Record<OrgMember['role'], string> = {
    OWNER: '所有者',
    ADMIN: '管理员',
    MEMBER: '成员'
};

onMounted(() => {
    org.fetchOrgs();
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">组织管理</h1>
            <Dialog v-model:open="dialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        创建组织
                    </Button>
                </DialogTrigger>
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
        </div>

        <!-- Tab bar -->
        <div class="flex w-fit gap-1 rounded-lg bg-bsb-bg-surface p-1">
            <button
                v-for="tab in ['orgs', 'members', 'pending'] as PageTab[]"
                :key="tab"
                class="rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                :class="activeTab === tab ? 'bg-white text-bsb-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-bsb-border-subtle' : 'text-bsb-text-tertiary hover:text-bsb-text-secondary'"
                @click="switchTab(tab)">
                {{ tab === 'orgs' ? '我的组织' : tab === 'members' ? '成员列表' : '待处理' }}
            </button>
        </div>

        <!-- My orgs tab -->
        <div v-if="activeTab === 'orgs'" class="space-y-3">
            <Card v-for="o in org.orgs" :key="o.id" class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)]" :class="o.id === org.currentOrgId ? 'ring-1 ring-bsb-accent-brand/40' : ''">
                <CardHeader class="flex flex-row items-center justify-between">
                    <div class="cursor-pointer" @click="router.push(`/org/${o.id}`)">
                        <CardTitle class="text-sm font-semibold text-bsb-text-primary">{{ o.name }}</CardTitle>
                        <CardDescription v-if="o.description" class="text-bsb-text-quaternary">
                            {{ o.description }}
                        </CardDescription>
                    </div>
                    <div class="flex items-center gap-2">
                        <Badge v-if="o.id === org.currentOrgId" class="bg-[#f2f9ff] text-bsb-accent-brand">当前</Badge>
                        <Button v-if="isOwner(o)" variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-500" @click="handleDelete(o)">
                            <Trash2 class="size-4" />
                        </Button>
                        <Button v-else variant="ghost" size="sm" class="text-bsb-text-quaternary hover:text-red-500" @click="handleQuit(o)">退出</Button>
                    </div>
                </CardHeader>
            </Card>
            <p v-if="org.orgs.length === 0" class="text-sm text-bsb-text-quaternary">暂无组织，点击"创建组织"开始</p>
        </div>

        <!-- Members tab -->
        <div v-if="activeTab === 'members'" class="space-y-3">
            <div v-if="!org.currentOrgId" class="text-sm text-bsb-text-tertiary">请先在"我的组织"中选择一个组织。</div>
            <template v-else>
                <div class="flex items-center justify-between">
                    <p class="text-sm text-bsb-text-tertiary">共 {{ members.length }} 名成员</p>
                    <Dialog v-if="canManage()" v-model:open="inviteDialogOpen">
                        <DialogTrigger as-child>
                            <Button variant="outline" size="sm" class="gap-2 border-bsb-border-standard">
                                <UserPlus class="size-4" />
                                邀请成员
                            </Button>
                        </DialogTrigger>
                        <DialogContent class="rounded-xl border-0 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                            <DialogHeader>
                                <DialogTitle class="font-display text-bsb-text-primary">邀请成员</DialogTitle>
                                <DialogDescription class="text-bsb-text-tertiary">输入要邀请的用户 ID</DialogDescription>
                            </DialogHeader>
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <Label class="text-bsb-text-secondary">用户 ID</Label>
                                    <Input v-model="inviteUserId" placeholder="用户 ID" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                                </div>
                                <p v-if="inviteError" class="text-sm text-red-500">{{ inviteError }}</p>
                                <DialogFooter>
                                    <Button class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="inviteLoading" @click="handleInvite">
                                        {{ inviteLoading ? '邀请中…' : '发送邀请' }}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card v-for="m in members" :key="m.id" class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <CardContent class="flex items-center justify-between py-4">
                        <div>
                            <p class="text-sm font-medium text-bsb-text-primary">
                                {{ m.user.nickname || m.user.username }}
                            </p>
                            <p class="text-xs text-bsb-text-tertiary">{{ m.user.email }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <Badge class="text-xs" :class="m.role === 'OWNER' ? 'bg-[#fff5f0] text-[#e8590c]' : m.role === 'ADMIN' ? 'bg-[#f2f9ff] text-bsb-accent-brand' : 'bg-bsb-bg-surface text-bsb-text-tertiary'">
                                {{ roleLabelMap[m.role] }}
                            </Badge>
                            <template v-if="canManage() && m.role !== 'OWNER' && m.userId !== auth.user?.id">
                                <Button v-if="m.role === 'MEMBER'" variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-bsb-accent-brand" title="设为管理员" @click="handleUpdateRole(m, 'ADMIN')">
                                    <UserCog class="size-3.5" />
                                </Button>
                                <Button v-else-if="m.role === 'ADMIN'" variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-bsb-text-secondary" title="降为普通成员" @click="handleUpdateRole(m, 'MEMBER')">
                                    <UserCog class="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" title="移除成员" @click="handleRemoveMember(m)">
                                    <UserMinus class="size-3.5" />
                                </Button>
                            </template>
                        </div>
                    </CardContent>
                </Card>

                <p v-if="!membersLoading && members.length === 0" class="text-sm text-bsb-text-quaternary">暂无成员。</p>
            </template>
        </div>

        <!-- Pending tab -->
        <div v-if="activeTab === 'pending'" class="space-y-3">
            <div v-if="!org.currentOrgId" class="text-sm text-bsb-text-tertiary">请先在"我的组织"中选择一个组织。</div>
            <template v-else>
                <Card v-for="item in pending" :key="item.id" class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <CardContent class="flex items-center justify-between py-4">
                        <div>
                            <p class="text-sm font-medium text-bsb-text-primary">
                                {{ item.user.nickname || item.user.username }}
                            </p>
                            <p class="text-xs text-bsb-text-tertiary">{{ item.user.email }}</p>
                        </div>
                        <div v-if="canManage()" class="flex gap-2">
                            <Button size="sm" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleAcceptApply(item)">接受</Button>
                            <Button variant="outline" size="sm" class="border-bsb-border-standard text-bsb-text-secondary hover:text-red-500" @click="handleRejectApply(item)">拒绝</Button>
                        </div>
                    </CardContent>
                </Card>
                <p v-if="!membersLoading && pending.length === 0" class="text-sm text-bsb-text-quaternary">暂无待处理申请。</p>
            </template>
        </div>
    </div>
</template>
