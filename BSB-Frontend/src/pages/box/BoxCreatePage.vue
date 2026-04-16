<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { setGridConfig } from '@/api/modules/node';

const router = useRouter();
const org = useOrgStore();
const nodeStore = useNodeStore();

const name = ref('');
const description = ref('');
const rows = ref(9);
const cols = ref(9);
const parentId = ref<string | null>(null);

// Only CONTAINER-type nodes can be parents for BOX
const containerNodes = computed(() => nodeStore.nodes.filter((n) => n.type === 'CONTAINER'));

const loading = ref(false);
const error = ref('');

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
        const created = await nodeStore.addNode({
            orgId: org.currentOrgId,
            parentId: parentId.value || undefined,
            name: name.value.trim(),
            description: description.value.trim() || undefined,
            type: 'BOX'
        });
        await setGridConfig({ nodeId: created.id, rows: rows.value, cols: cols.value }).send();
        router.push('/box');
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    if (org.currentOrgId) nodeStore.fetchByOrg(org.currentOrgId);
});
watch(
    () => org.currentOrgId,
    (id) => {
        if (id) nodeStore.fetchByOrg(id);
    }
);
</script>

<template>
    <div class="max-w-xl space-y-6">
        <h1 class="text-2xl font-semibold text-bsb-text-primary">新建储存盒</h1>

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
                        <Label>上级节点（CONTAINER）</Label>
                        <select v-model="parentId" class="h-9 w-full rounded-md border border-bsb-border-standard bg-white px-3 text-sm text-bsb-text-primary">
                            <option :value="null">— 不指定 —</option>
                            <option v-for="node in containerNodes" :key="node.id" :value="node.id">
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
    </div>
</template>
