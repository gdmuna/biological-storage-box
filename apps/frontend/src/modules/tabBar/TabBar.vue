<template>
    <ScrollArea class="scroll-smooth bg-background">
        <ButtonGroup>
            <TabBarItem v-for="entity in tabEntity" :key="entity.id" :data-activated="entity.id === activeTabId" @click="handleSwitch(entity.id)" @close="handleDelete(entity.id)">
                {{ getActiveEntry(entity.id).value?.title }}
            </TabBarItem>
        </ButtonGroup>
        <ScrollBar orientation="horizontal" class="h-2 z-10" />
    </ScrollArea>
</template>

<script setup lang="ts">
import TabBarItem from './TabBarItem.vue';
import { useTab, useViewHistory, useTabComponent } from '@/composables';
import { ButtonGroup } from '@/components/ui/button-group';
import { useRouter } from 'vue-router';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const { tabEntity, setActiveTabId, deleteTab, activeTabId } = useTab();

const { withSwitching } = useTabComponent();

const router = useRouter();

const { getActiveEntry } = useViewHistory();

function handleSwitch(tabId: string) {
    withSwitching(async () => {
        const entry = getActiveEntry(tabId).value;
        const nextPath = entry?.path ?? '/workbench/welcome';
        await router.push(nextPath);
        setActiveTabId(tabId);
    });
}

function handleDelete(tabId: string) {
    withSwitching(async () => {
        console.log('FUCK YOU DELETE HANDLER');
        const { next } = deleteTab(tabId);
        const entry = getActiveEntry(next).value;
        const nextPath = entry?.path ?? '/workbench/welcome';
        await router.push(nextPath);
        setActiveTabId(next);
    });
}
</script>

<style scoped></style>
