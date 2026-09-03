<template>
    <div class="flex flex-col m-auto gap-4 p-4">
        <h1>WorkbenchPlayground</h1>
        <div class="flex gap-4">
            <Input v-model="input1" placeholder="Type something..." />
            <Button @click="Alert(input1)">log</Button>
        </div>
        <div class="flex gap-4">
            <Input v-model="input2" placeholder="Type something..." />
            <Button @click="Alert(input2)">log</Button>
        </div>
        <div class="flex gap-4">
            <Input v-model="input3" placeholder="Type something..." />
            <Button @click="Alert(input3)">log</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTab, useViewHistory } from '@/composables';
import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';

const input1 = defineModel('input1', { default: 'Hello, World!' });
const input2 = defineModel('input2', { default: '' });
const input3 = defineModel('input3', { default: '' });

function Alert(payload: any) {
    alert(payload);
}

const { activeTabId } = useTab();
const { getEntity } = useViewHistory();

onMounted(() => {
    console.log('Component <WorkbenchPlayground> mounted');
});

onUnmounted(() => {
    console.log('Component <WorkbenchPlayground> unmounted');
});

onActivated(() => {
    console.log('Component <WorkbenchPlayground> activated');
    console.log('activeTabId:', activeTabId.value);
    const entry = getEntity(activeTabId);
    console.log('entry:', entry.value);
});

onDeactivated(() => {
    console.log('Component <WorkbenchPlayground> deactivated');
    console.log('activeTabId:', activeTabId.value);
    const entry = getEntity(activeTabId);
    console.log('entry:', entry.value);
});
</script>

<style scoped></style>
