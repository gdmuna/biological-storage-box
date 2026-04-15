<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgStore } from '@/stores/org';
import { createBox } from '@/api/modules/box';
import { listRoots } from '@/api/modules/root';
import { listNodes } from '@/api/modules/node';
import type { Node } from '@/schemas/node.schema';
import RootManager from '@/components/root/RootManager.vue';

const router = useRouter();
const org = useOrgStore();

const name = ref('');
const description = ref('');
const rows = ref(9);
const cols = ref(9);
const rootId = ref<string | null>(null);
const roots = ref<Array<{ id: string; name: string }>>([]);
const nodeId = ref<string | null>(null);
const nodes = ref<Node[]>([]);

const loading = ref(false);
const error = ref('');

async function fetchRoots() {
    if (!org.currentOrgId) return;
    try {
        const data = await listRoots(org.currentOrgId).send();
        roots.value = data.map((item) => ({ id: item.id, name: item.name }));
    } catch {
        roots.value = [];
    }
}

async function fetchNodes() {
    if (!org.currentOrgId) return;
    try {
        nodes.value = await listNodes({ orgId: org.currentOrgId }).send();
    } catch {
        nodes.value = [];
    }
}

async function handleSubmit() {
    if (!org.currentOrgId) {
        error.value = '请先选择组织';
        return;
    }
    if (!name.value.trim()) {
        error.value = '请输入储存盒名称';
        return;
    }
    loading.value = true;
    error.value = '';
    try {
        await createBox({
            orgId: org.currentOrgId,
            rootId: rootId.value || undefined,
            nodeId: nodeId.value || undefined,
            name: name.value.trim(),
            description: description.value.trim() || undefined,
            rows: rows.value,
            cols: cols.value
        }).send();
        router.push('/box');
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchRoots();
    fetchNodes();
});
</script>

<template>
    <div class="max-w-xl space-y-6">
        <h1 class="text-2xl font-[590] text-bsb-text-primary">新建储存盒</h1>

        <Card class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardHeader>
                <CardTitle class="text-base text-bsb-text-primary">基础信息</CardTitle>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleSubmit">
                    <div class="space-y-2">
                        <Label>名称</Label>
                        <Input v-model="name" placeholder="例如：样本盒 A-01" />
                    </div>

                    <div class="space-y-2">
                        <Label>描述</Label>
                        <Input v-model="description" placeholder="可选描述" />
                    </div>

                    <div class="space-y-2">
                        <Label>房间</Label>
                        <select v-model="rootId" class="h-9 w-full rounded-md border border-bsb-border-standard bg-white px-3 text-sm text-bsb-text-primary">
                            <option :value="null">未分配</option>
                            <option v-for="root in roots" :key="root.id" :value="root.id">
                                {{ root.name }}
                            </option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <Label>存放位置（节点）</Label>
                        <select v-model="nodeId" class="h-9 w-full rounded-md border border-bsb-border-standard bg-white px-3 text-sm text-bsb-text-primary">
                            <option :value="null">— 不指定 —</option>
                            <option v-for="node in nodes" :key="node.id" :value="node.id">
                                {{ node.name }}
                            </option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label>行数</Label>
                            <Input v-model.number="rows" type="number" min="1" max="99" />
                        </div>
                        <div class="space-y-2">
                            <Label>列数</Label>
                            <Input v-model.number="cols" type="number" min="1" max="99" />
                        </div>
                    </div>

                    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

                    <div class="flex items-center gap-2">
                        <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="loading">
                            {{ loading ? '创建中…' : '创建' }}
                        </Button>
                        <Button type="button" variant="outline" @click="router.push('/box')">取消</Button>
                    </div>
                </form>
            </CardContent>
        </Card>

        <RootManager @created="fetchRoots" />
    </div>
</template>
