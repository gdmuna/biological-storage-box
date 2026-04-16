<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, FlaskConical, Tag } from 'lucide-vue-next';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { useReagentStore } from '@/stores/reagent';
import { storeToRefs } from 'pinia';
import { listReagentLogs } from '@/api/modules/feedback';

const org = useOrgStore();
const nodeStore = useNodeStore();
const reagentStore = useReagentStore();
const { reagents, reagentTypes } = storeToRefs(reagentStore);

// BOX-type nodes as the "boxes" list
const boxes = computed(() => nodeStore.nodes.filter((n) => n.type === 'BOX'));

// Reagent tab state
const reagentLogs = ref<Record<string, Array<{ id: string; action?: string; createdAt?: string }>>>({});

// Create reagent dialog
const createReagentOpen = ref(false);
const newReagentBoxId = ref('__none__');
const newReagentPosition = ref('');
const newReagentName = ref('');
const newReagentDesc = ref('');
const newReagentTypeId = ref('__none__');
const creatingReagent = ref(false);

// Create type dialog
const createTypeOpen = ref(false);
const newTypeName = ref('');
const newTypeDesc = ref('');
const newTypeColor = ref('');
const newTypeUnit = ref('');
const creatingType = ref(false);

async function fetchData(force = false) {
    if (!org.currentOrgId) return;
    try {
        await nodeStore.fetchByOrg(org.currentOrgId, force);
        await reagentStore.initData(org.currentOrgId, force);
    } catch {
        /* empty */
    }
}

function getBoxName(nodeId: string | null | undefined) {
    if (!nodeId) return '未知';
    return nodeStore.nodes.find((n) => n.id === nodeId)?.name ?? nodeId;
}

function getTypeName(typeId: string | null | undefined) {
    if (!typeId) return null;
    return reagentTypes.value.find((t) => t.id === typeId)?.name ?? null;
}

async function handleLoadLogs(reagentId: string) {
    try {
        const logs = await listReagentLogs({ reagentId, limit: 20, offset: 0 }).send();
        reagentLogs.value[reagentId] = logs;
    } catch {
        reagentLogs.value[reagentId] = [];
    }
}

async function handleCreateReagent() {
    if (!newReagentBoxId.value || newReagentBoxId.value === '__none__' || !newReagentPosition.value.trim() || !newReagentName.value.trim()) return;
    creatingReagent.value = true;
    try {
        await reagentStore.addReagent({
            nodeId: newReagentBoxId.value,
            position: newReagentPosition.value.trim(),
            name: newReagentName.value.trim(),
            description: newReagentDesc.value.trim() || undefined,
            reagentTypeId: newReagentTypeId.value !== '__none__' ? newReagentTypeId.value : undefined
        });
        newReagentBoxId.value = '__none__';
        newReagentPosition.value = '';
        newReagentName.value = '';
        newReagentDesc.value = '';
        newReagentTypeId.value = '__none__';
        createReagentOpen.value = false;
        await fetchData();
    } catch {
        /* empty */
    } finally {
        creatingReagent.value = false;
    }
}

async function handleCreateType() {
    if (!newTypeName.value.trim() || !org.currentOrgId) return;
    creatingType.value = true;
    try {
        await reagentStore.addReagentType({
            orgId: org.currentOrgId,
            name: newTypeName.value.trim(),
            description: newTypeDesc.value.trim() || undefined,
            colorHex: newTypeColor.value.trim() || undefined,
            unit: newTypeUnit.value.trim() || undefined
        });
        newTypeName.value = '';
        newTypeDesc.value = '';
        newTypeColor.value = '';
        newTypeUnit.value = '';
        createTypeOpen.value = false;
    } catch {
        /* empty */
    } finally {
        creatingType.value = false;
    }
}

async function handelDelete(id: string) {
    try {
        await reagentStore.removeReagent(id);
    } catch {
        /* empty */
    }
}

async function handleDeleteType(id: string) {
    try {
        await reagentStore.removeReagentType(id);
    } catch {
        /* empty */
    }
}

onMounted(() => fetchData(true));
watch(
    () => org.currentOrgId,
    () => fetchData(true)
);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-semibold text-bsb-text-primary">试剂管理</h1>

        <Tabs default-value="reagents">
            <TabsList class="w-full justify-start gap-0 rounded-none border-b border-bsb-border-standard bg-transparent p-0">
                <TabsTrigger value="reagents" class="rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-bsb-text-tertiary data-[state=active]:border-bsb-accent-brand data-[state=active]:bg-transparent data-[state=active]:text-bsb-text-primary">
                    <FlaskConical class="mr-2 size-4" />
                    试剂列表
                </TabsTrigger>
                <TabsTrigger value="types" class="rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-bsb-text-tertiary data-[state=active]:border-bsb-accent-brand data-[state=active]:bg-transparent data-[state=active]:text-bsb-text-primary">
                    <Tag class="mr-2 size-4" />
                    试剂类型
                </TabsTrigger>
            </TabsList>

            <!-- Tab 1: Reagent List -->
            <TabsContent value="reagents" class="mt-4 space-y-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-bsb-text-tertiary">当前组织下所有试剂</p>
                    <Dialog v-model:open="createReagentOpen">
                        <DialogTrigger as-child>
                            <Button size="sm" class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                                <Plus class="size-4" />
                                新建试剂
                            </Button>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>新建试剂</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-4 py-2">
                                <div class="space-y-1.5">
                                    <Label>
                                        储存盒
                                        <span class="text-red-500">*</span>
                                    </Label>
                                    <Select v-model="newReagentBoxId">
                                        <SelectTrigger class="border-bsb-border-standard">
                                            <SelectValue placeholder="选择储存盒" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__" disabled>请选择储存盒</SelectItem>
                                            <SelectItem v-for="box in boxes" :key="box.id" :value="box.id">
                                                {{ box.name }}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div class="space-y-1.5">
                                    <Label>
                                        位置
                                        <span class="text-red-500">*</span>
                                    </Label>
                                    <Input v-model="newReagentPosition" placeholder="格式：行-列，例如 1-1" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>
                                        试剂名称
                                        <span class="text-red-500">*</span>
                                    </Label>
                                    <Input v-model="newReagentName" placeholder="输入试剂名称" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>备注</Label>
                                    <Input v-model="newReagentDesc" placeholder="可选" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>试剂类型</Label>
                                    <Select v-model="newReagentTypeId">
                                        <SelectTrigger class="border-bsb-border-standard">
                                            <SelectValue placeholder="选择类型（可选）" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">无</SelectItem>
                                            <SelectItem v-for="rt in reagentTypes" :key="rt.id" :value="rt.id">
                                                <div class="flex items-center gap-2">
                                                    <span v-if="rt.colorHex" class="inline-block size-3 rounded-full" :style="{ background: rt.colorHex }" />
                                                    {{ rt.name }}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" @click="createReagentOpen = false">取消</Button>
                                <Button :disabled="creatingReagent || newReagentBoxId === '__none__' || !newReagentPosition.trim() || !newReagentName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreateReagent">
                                    {{ creatingReagent ? '创建中…' : '确认创建' }}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div v-if="reagents.length > 0" class="space-y-3">
                    <Card v-for="reagent in reagents" :key="reagent.id" class="reagent-card border-bsb-border-standard bg-bsb-bg-panel">
                        <CardHeader class="flex flex-row items-center justify-between">
                            <CardTitle class="text-sm text-bsb-text-primary">{{ reagent.name }}</CardTitle>
                            <div class="flex flex-col space-y-1">
                                <Button variant="ghost" size="icon" class="ml-auto text-bsb-text-quaternary hover:text-red-500 cursor-pointer" @click="handelDelete(reagent.id)">
                                    <Trash2 class="size-4" />
                                </Button>
                                <div class="flex items-center gap-2">
                                    <Badge variant="outline" class="text-bsb-text-tertiary">
                                        {{ reagent.position }}
                                    </Badge>
                                    <Badge class="bg-bsb-bg-surface text-bsb-text-quaternary">
                                        {{ getBoxName(reagent.nodeId) }}
                                    </Badge>
                                    <Badge v-if="getTypeName(reagent.reagentTypeId)" variant="outline" class="border-bsb-accent-brand/30 text-bsb-accent-brand">
                                        {{ getTypeName(reagent.reagentTypeId) }}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent v-if="reagent.description" class="pt-0">
                            <p class="text-xs text-bsb-text-quaternary">{{ reagent.description }}</p>
                        </CardContent>
                        <!-- <CardContent class="pt-0">
                            <Button size="sm" variant="outline" @click="handleLoadLogs(reagent.id)">查看日志</Button>
                            <div v-if="reagentLogs[reagent.id]?.length" class="mt-2 space-y-1">
                                <p v-for="log in reagentLogs[reagent.id]" :key="log.id" class="text-xs text-bsb-text-quaternary">{{ log.action || '操作' }} {{ log.createdAt }}</p>
                            </div>
                        </CardContent> -->
                    </Card>
                </div>
                <p v-else class="text-sm text-bsb-text-quaternary">暂无试剂数据</p>
            </TabsContent>

            <!-- Tab 2: Reagent Types -->
            <TabsContent value="types" class="mt-4 space-y-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-bsb-text-tertiary">管理组织的试剂类型</p>
                    <Dialog v-model:open="createTypeOpen">
                        <DialogTrigger as-child>
                            <Button size="sm" class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                                <Plus class="size-4" />
                                新建类型
                            </Button>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>新建试剂类型</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-4 py-2">
                                <div class="space-y-1.5">
                                    <Label>
                                        类型名称
                                        <span class="text-red-500">*</span>
                                    </Label>
                                    <Input v-model="newTypeName" placeholder="例如：DNA、蛋白质" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>描述</Label>
                                    <Input v-model="newTypeDesc" placeholder="可选" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>颜色标识</Label>
                                    <div class="flex items-center gap-2">
                                        <input v-model="newTypeColor" type="color" class="size-9 cursor-pointer rounded border border-bsb-border-standard p-0.5" />
                                        <Input v-model="newTypeColor" placeholder="#hex（可选）" class="flex-1 border-bsb-border-standard" />
                                    </div>
                                </div>
                                <div class="space-y-1.5">
                                    <Label>单位</Label>
                                    <Input v-model="newTypeUnit" placeholder="例如：μL、mg（可选）" class="border-bsb-border-standard" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" @click="createTypeOpen = false">取消</Button>
                                <Button :disabled="creatingType || !newTypeName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreateType">
                                    {{ creatingType ? '创建中…' : '确认创建' }}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div v-if="reagentTypes.length > 0" class="space-y-2">
                    <Card v-for="rt in reagentTypes" :key="rt.id" class="border-bsb-border-standard bg-bsb-bg-panel">
                        <CardHeader class="flex flex-row items-center justify-between py-3">
                            <div class="flex items-center gap-3">
                                <span v-if="rt.colorHex" class="inline-block size-4 rounded-full border border-bsb-border-standard" :style="{ background: rt.colorHex }" />
                                <CardTitle class="text-sm text-bsb-text-primary">{{ rt.name }}</CardTitle>
                                <Badge v-if="rt.unit" variant="outline" class="text-xs text-bsb-text-tertiary">{{ rt.unit }}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleDeleteType(rt.id)">
                                <Trash2 class="size-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent v-if="rt.description" class="pt-0">
                            <p class="text-xs text-bsb-text-quaternary">{{ rt.description }}</p>
                        </CardContent>
                    </Card>
                </div>
                <p v-else class="text-sm text-bsb-text-quaternary">暂无试剂类型，点击右上角新建</p>
            </TabsContent>
        </Tabs>
    </div>
</template>
