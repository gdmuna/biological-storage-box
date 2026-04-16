<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgStore } from '@/stores/org';

const emit = defineEmits<{
    created: [];
}>();

const org = useOrgStore();
const roots = ref<Array<{ id: string; name: string }>>([]);
const name = ref('');
const description = ref('');
const loading = ref(false);

async function fetchRoots() {
    if (!org.currentOrgId) return;
    // const data = await listRoots(org.currentOrgId).send();
    // roots.value = data.map((item) => ({ id: item.id, name: item.name }));
}

async function handleCreateRoot() {
    if (!org.currentOrgId || !name.value.trim()) return;
    loading.value = true;
    try {
        // await createRoot({
        //     orgId: org.currentOrgId,
        //     name: name.value.trim(),
        //     description: description.value.trim() || undefined
        // }).send();
        name.value = '';
        description.value = '';
        await fetchRoots();
        emit('created');
    } finally {
        loading.value = false;
    }
}

onMounted(fetchRoots);
</script>

<template>
    <div class="space-y-3 rounded-lg border border-bsb-border-standard p-4">
        <h3 class="text-sm font-semibold text-bsb-text-primary">房间管理</h3>
        <div class="space-y-2">
            <Label>名称</Label>
            <Input v-model="name" placeholder="新建房间名称" />
        </div>
        <div class="space-y-2">
            <Label>描述</Label>
            <Input v-model="description" placeholder="可选描述" />
        </div>
        <Button type="button" :disabled="loading" @click="handleCreateRoot">
            {{ loading ? '创建中…' : '新建房间' }}
        </Button>

        <div v-if="roots.length" class="space-y-1">
            <p v-for="root in roots" :key="root.id" class="text-xs text-bsb-text-tertiary">{{ root.name }}</p>
        </div>
    </div>
</template>
