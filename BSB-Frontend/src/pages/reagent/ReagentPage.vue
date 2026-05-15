<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, AlertTriangle, FlaskConical, Search } from 'lucide-vue-next';
import EmptyState from '@/components/EmptyState.vue';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { useReagentStore } from '@/stores/reagent';
import { storeToRefs } from 'pinia';
import { CreateReagentSchema } from '@/schemas/reagent.schema';
import type { HazardLevel } from '@/schemas/reagent.schema';

const org = useOrgStore();
const nodeStore = useNodeStore();
const reagentStore = useReagentStore();
const { reagents, reagentTypes } = storeToRefs(reagentStore);
const router = useRouter();

const searchKeyword = ref('');
const filterTypeId = ref('__all__');

const filteredReagents = computed(() => {
    let list = reagents.value;
    const kw = searchKeyword.value.trim().toLowerCase();
    if (kw) {
        list = list.filter((r) => r.name.toLowerCase().includes(kw) || (r.position ?? '').toLowerCase().includes(kw));
    }
    if (filterTypeId.value !== '__all__') {
        list = list.filter((r) => r.reagentTypeId === filterTypeId.value);
    }
    return list;
});

const boxes = computed(() => nodeStore.nodes.filter((n) => n.type === 'BOX'));

const createReagentOpen = ref(false);
const newReagentBoxId = ref('__none__');
const newReagentPosition = ref('');
const newReagentName = ref('');
const newReagentDesc = ref('');
const newReagentTypeId = ref('__none__');
const newReagentQuantity = ref('');
const newReagentUnit = ref('');
const newReagentExpiryDate = ref('');
const newReagentManufactureDate = ref('');
const newReagentBatchNo = ref('');
const newReagentCatalogNo = ref('');
const newReagentManufacturer = ref('');
const newReagentCasNumber = ref('');
const newReagentHazardLevel = ref<HazardLevel | '__none__'>('__none__');
const newReagentMinStock = ref('');
const createError = ref('');
const creatingReagent = ref(false);

const HAZARD_LEVELS: { value: HazardLevel; label: string }[] = [
    { value: 'NONE', label: '无危险' },
    { value: 'GHS01', label: 'GHS01 — 爆炸物' },
    { value: 'GHS02', label: 'GHS02 — 易燃物' },
    { value: 'GHS03', label: 'GHS03 — 氧化剂' },
    { value: 'GHS04', label: 'GHS04 — 压缩气体' },
    { value: 'GHS05', label: 'GHS05 — 腐蚀性' },
    { value: 'GHS06', label: 'GHS06 — 急性毒性' },
    { value: 'GHS07', label: 'GHS07 — 刺激性' },
    { value: 'GHS08', label: 'GHS08 — 健康危害' },
    { value: 'GHS09', label: 'GHS09 — 环境危害' }
];

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

function getType(typeId: string | null | undefined) {
    if (!typeId) return null;
    return reagentTypes.value.find((t) => t.id === typeId) ?? null;
}

function resetCreateForm() {
    newReagentBoxId.value = '__none__';
    newReagentPosition.value = '';
    newReagentName.value = '';
    newReagentDesc.value = '';
    newReagentTypeId.value = '__none__';
    newReagentQuantity.value = '';
    newReagentUnit.value = '';
    newReagentExpiryDate.value = '';
    newReagentManufactureDate.value = '';
    newReagentBatchNo.value = '';
    newReagentCatalogNo.value = '';
    newReagentManufacturer.value = '';
    newReagentCasNumber.value = '';
    newReagentHazardLevel.value = '__none__';
    newReagentMinStock.value = '';
    createError.value = '';
}

async function handleCreateReagent() {
    createError.value = '';
    const parsed = CreateReagentSchema.safeParse({
        nodeId: newReagentBoxId.value === '__none__' ? '' : newReagentBoxId.value,
        position: newReagentPosition.value.trim(),
        name: newReagentName.value.trim(),
        description: newReagentDesc.value.trim() || undefined,
        reagentTypeId: newReagentTypeId.value !== '__none__' ? newReagentTypeId.value : undefined,
        quantity: newReagentQuantity.value !== '' ? Number(newReagentQuantity.value) : undefined,
        unit: newReagentUnit.value.trim() || undefined,
        expiryDate: newReagentExpiryDate.value ? new Date(newReagentExpiryDate.value).toISOString() : undefined,
        manufactureDate: newReagentManufactureDate.value ? new Date(newReagentManufactureDate.value).toISOString() : undefined,
        batchNo: newReagentBatchNo.value.trim() || undefined,
        catalogNo: newReagentCatalogNo.value.trim() || undefined,
        manufacturer: newReagentManufacturer.value.trim() || undefined,
        casNumber: newReagentCasNumber.value.trim() || undefined,
        hazardLevel: newReagentHazardLevel.value !== '__none__' ? newReagentHazardLevel.value : undefined,
        minStockThreshold: newReagentMinStock.value !== '' ? Number(newReagentMinStock.value) : undefined
    });
    if (!parsed.success) {
        createError.value = parsed.error.issues[0]?.message ?? '输入无效';
        return;
    }
    creatingReagent.value = true;
    try {
        await reagentStore.addReagent(parsed.data);
        resetCreateForm();
        createReagentOpen.value = false;
    } catch {
        createError.value = '创建失败，请重试';
    } finally {
        creatingReagent.value = false;
    }
}

async function handelDelete(id: string) {
    try {
        await reagentStore.removeReagent(id);
    } catch {
        /* empty */
    }
}

function hazardLevelClass(level: string | null | undefined) {
    if (!level || level === 'NONE') return 'bg-bsb-bg-surface text-bsb-text-quaternary';
    if (['GHS01', 'GHS02', 'GHS06'].includes(level)) return 'bg-red-100 text-red-700 border-red-300';
    if (['GHS03', 'GHS04'].includes(level)) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
}

onMounted(() => fetchData(true));
watch(
    () => org.currentOrgId,
    () => fetchData(true)
);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">试剂管理</h1>
            <Dialog
                v-model:open="createReagentOpen"
                @update:open="
                    (v) => {
                        if (!v) resetCreateForm();
                    }
                ">
                <DialogTrigger as-child>
                    <Button size="sm" class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        新建试剂
                    </Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>新建试剂</DialogTitle>
                        <DialogDescription class="sr-only">填写试剂基本信息、规格库存及产品溯源数据</DialogDescription>
                    </DialogHeader>
                    <Tabs default-value="basic" class="w-full">
                        <TabsList class="w-full">
                            <TabsTrigger value="basic" class="flex-1">基本信息</TabsTrigger>
                            <TabsTrigger value="stock" class="flex-1">规格与库存</TabsTrigger>
                            <TabsTrigger value="product" class="flex-1">产品溯源</TabsTrigger>
                        </TabsList>

                        <!-- Tab 1: 基本信息 -->
                        <TabsContent value="basic" class="space-y-3 pt-3">
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
                            <div class="space-y-1.5">
                                <Label>备注</Label>
                                <Input v-model="newReagentDesc" placeholder="可选" class="border-bsb-border-standard" />
                            </div>
                        </TabsContent>

                        <!-- Tab 2: 规格与库存 -->
                        <TabsContent value="stock" class="space-y-3 pt-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <Label>库存数量</Label>
                                    <Input v-model="newReagentQuantity" type="number" min="0" step="0.01" placeholder="例如 100" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>单位</Label>
                                    <Input v-model="newReagentUnit" placeholder="例如 mL、mg" class="border-bsb-border-standard" />
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <Label>低库存预警阈值</Label>
                                <Input v-model="newReagentMinStock" type="number" min="0" step="0.01" placeholder="低于此值时预警" class="border-bsb-border-standard" />
                            </div>
                            <div class="space-y-1.5">
                                <Label>GHS 危险类别</Label>
                                <Select v-model="newReagentHazardLevel">
                                    <SelectTrigger class="border-bsb-border-standard">
                                        <SelectValue placeholder="选择危险类别（可选）" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">无</SelectItem>
                                        <SelectItem v-for="hl in HAZARD_LEVELS" :key="hl.value" :value="hl.value">
                                            {{ hl.label }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <!-- Tab 3: 产品溯源 -->
                        <TabsContent value="product" class="space-y-3 pt-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <Label>生产日期</Label>
                                    <Input v-model="newReagentManufactureDate" type="date" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>有效期</Label>
                                    <Input v-model="newReagentExpiryDate" type="date" class="border-bsb-border-standard" />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <Label>批次号</Label>
                                    <Input v-model="newReagentBatchNo" placeholder="Batch No." class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>货号</Label>
                                    <Input v-model="newReagentCatalogNo" placeholder="Catalog No." class="border-bsb-border-standard" />
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <Label>生产厂商</Label>
                                <Input v-model="newReagentManufacturer" placeholder="例如 Sigma-Aldrich" class="border-bsb-border-standard" />
                            </div>
                            <div class="space-y-1.5">
                                <Label>CAS 号</Label>
                                <Input v-model="newReagentCasNumber" placeholder="例如 50-00-0" class="border-bsb-border-standard" />
                            </div>
                        </TabsContent>
                    </Tabs>
                    <p v-if="createError" class="text-sm text-red-500">{{ createError }}</p>
                    <DialogFooter>
                        <Button variant="outline" @click="createReagentOpen = false">取消</Button>
                        <Button :disabled="creatingReagent || newReagentBoxId === '__none__' || !newReagentPosition.trim() || !newReagentName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreateReagent">
                            {{ creatingReagent ? '创建中…' : '确认创建' }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <p class="text-sm text-bsb-text-tertiary">当前组织下所有试剂</p>

        <!-- 搜索 + 类型筛选 -->
        <div class="flex items-center gap-2">
            <div class="relative max-w-sm flex-1">
                <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
                <Input v-model="searchKeyword" placeholder="搜索试剂名称或位置…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10 text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
            </div>
            <Select v-model="filterTypeId">
                <SelectTrigger class="w-36 border-bsb-border-standard">
                    <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">全部类型</SelectItem>
                    <SelectItem v-for="rt in reagentTypes" :key="rt.id" :value="rt.id">{{ rt.name }}</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div v-if="reagents.length > 0" class="rounded-md border border-bsb-border-standard overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-bsb-bg-surface text-xs text-bsb-text-secondary">
                    <tr>
                        <th class="px-3 py-2 text-left font-medium">名称</th>
                        <th class="px-3 py-2 text-left font-medium">位置</th>
                        <th class="px-3 py-2 text-left font-medium">类型</th>
                        <th class="px-3 py-2 text-left font-medium">库存</th>
                        <th class="px-3 py-2 text-left font-medium">有效期</th>
                        <th class="px-3 py-2 text-left font-medium">危险级</th>
                        <th class="px-2 py-2 w-8"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-bsb-border-standard">
                    <tr v-for="reagent in filteredReagents" :key="reagent.id" class="bg-white hover:bg-bsb-bg-surface/50 transition-colors cursor-pointer" @click="reagent.nodeId && router.push(`/box/${reagent.nodeId}`)">
                        <td class="px-3 py-2.5">
                            <span class="font-medium text-bsb-text-primary">{{ reagent.name }}</span>
                            <p v-if="reagent.description" class="text-xs text-bsb-text-quaternary truncate max-w-[160px]">{{ reagent.description }}</p>
                        </td>
                        <td class="px-3 py-2.5 text-xs text-bsb-text-tertiary">
                            <div class="flex flex-col gap-0.5">
                                <span class="font-mono">{{ reagent.position }}</span>
                                <span class="text-bsb-text-quaternary truncate max-w-[100px]">{{ getBoxName(reagent.nodeId) }}</span>
                            </div>
                        </td>
                        <td class="px-3 py-2.5">
                            <Badge v-if="getType(reagent.reagentTypeId)" variant="outline" class="text-xs whitespace-nowrap" :style="getType(reagent.reagentTypeId)?.colorHex ? { borderColor: getType(reagent.reagentTypeId)!.colorHex + '60', color: getType(reagent.reagentTypeId)!.colorHex } : {}">
                                {{ getType(reagent.reagentTypeId)?.name }}
                            </Badge>
                            <span v-else class="text-bsb-text-quaternary text-xs">—</span>
                        </td>
                        <td class="px-3 py-2.5 text-xs text-bsb-text-tertiary whitespace-nowrap">
                            <span v-if="reagent.quantity != null">
                                <span class="font-medium text-bsb-text-primary">{{ reagent.quantity }}</span>
                                {{ reagent.unit ?? '' }}
                            </span>
                            <span v-else class="text-bsb-text-quaternary">—</span>
                        </td>
                        <td class="px-3 py-2.5 text-xs text-bsb-text-tertiary whitespace-nowrap">
                            <span v-if="reagent.expiryDate">{{ new Date(reagent.expiryDate).toLocaleDateString('zh-CN') }}</span>
                            <span v-else class="text-bsb-text-quaternary">—</span>
                        </td>
                        <td class="px-3 py-2.5">
                            <Badge v-if="reagent.hazardLevel && reagent.hazardLevel !== 'NONE'" variant="outline" :class="['text-xs whitespace-nowrap', hazardLevelClass(reagent.hazardLevel)]">
                                <AlertTriangle class="mr-1 size-3" />
                                {{ reagent.hazardLevel }}
                            </Badge>
                            <span v-else class="text-bsb-text-quaternary text-xs">—</span>
                        </td>
                        <td class="px-2 py-2.5">
                            <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500 cursor-pointer" @click.stop="handelDelete(reagent.id)">
                                <Trash2 class="size-3.5" />
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p v-else-if="reagents.length > 0 && filteredReagents.length === 0" class="text-sm text-bsb-text-quaternary">未找到匹配的试剂</p>
        <EmptyState v-else-if="reagents.length === 0" :icon="FlaskConical" title="暂无试剂数据" description="点击右上角“新建试剂”开始添加" />
    </div>
</template>
