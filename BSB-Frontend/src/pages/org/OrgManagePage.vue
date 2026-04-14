<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Plus, Trash2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOrgStore } from '@/stores/org';
import { createOrg, deleteOrg } from '@/api/modules/org';
import { CreateOrgFormSchema } from '@/schemas/org.schema';
import type { Org } from '@/schemas/org.schema';
import { useAuthStore } from '@/stores/auth';
import { staggerListIn } from '@/utils/animation';

const org = useOrgStore();
const auth = useAuthStore();

const newName = ref('');
const newDesc = ref('');
const error = ref('');
const loading = ref(false);
const dialogOpen = ref(false);

async function handleCreate() {
    error.value = '';
    const result = CreateOrgFormSchema.safeParse({
        name: newName.value,
        description: newDesc.value || undefined
    });
    if (!result.success) {
        error.value = result.error.issues[0].message;
        return;
    }
    loading.value = true;
    try {
        await createOrg(result.data).send();
        await org.fetchOrgs();
        newName.value = '';
        newDesc.value = '';
        dialogOpen.value = false;
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        loading.value = false;
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

function isOwner(orgItem: Org) {
    return orgItem.ownerId === auth.user?.id;
}

onMounted(() => {
    staggerListIn('.org-card');
});
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-[590] text-bsb-text-primary">组织管理</h1>
            <Dialog v-model:open="dialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        创建组织
                    </Button>
                </DialogTrigger>
                <DialogContent class="border-bsb-border-standard bg-bsb-bg-panel">
                    <DialogHeader>
                        <DialogTitle class="text-bsb-text-primary">创建新组织</DialogTitle>
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
                        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
                        <DialogFooter>
                            <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="loading">
                                {{ loading ? '创建中…' : '创建' }}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <Separator class="bg-bsb-border-standard" />

        <!-- Org list -->
        <div class="space-y-3">
            <Card v-for="o in org.orgs" :key="o.id" class="org-card border-bsb-border-standard bg-bsb-bg-panel" :class="o.id === org.currentOrgId ? 'ring-1 ring-bsb-accent-brand/40' : ''">
                <CardHeader class="flex flex-row items-center justify-between">
                    <div class="cursor-pointer" @click="org.selectOrg(o.id)">
                        <CardTitle class="text-sm text-bsb-text-primary">{{ o.name }}</CardTitle>
                        <CardDescription v-if="o.description" class="text-bsb-text-quaternary">
                            {{ o.description }}
                        </CardDescription>
                    </div>
                    <div class="flex items-center gap-2">
                        <Badge v-if="o.id === org.currentOrgId" class="bg-bsb-accent-brand/20 text-bsb-accent-brand">当前</Badge>
                        <Button v-if="isOwner(o)" variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-400" @click="handleDelete(o)">
                            <Trash2 class="size-4" />
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        </div>

        <p v-if="org.orgs.length === 0" class="text-sm text-bsb-text-quaternary">暂无组织，点击"创建组织"开始</p>
    </div>
</template>
