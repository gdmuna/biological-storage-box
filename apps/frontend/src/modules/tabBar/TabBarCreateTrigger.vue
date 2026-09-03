<template>
    <Button variant="ghost" class="size-7 hover:bg-neutral-200" @click="handleCreate">
        <slot>
            <Plus class="size-4" />
        </slot>
    </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useTab, useViewHistory, useTabComponent } from '@/composables';

import { Plus } from '@lucide/vue';

const { setActiveTabId, createTab } = useTab();

const { withSwitching } = useTabComponent();

const { syncPush } = useViewHistory();

function handleCreate() {
    withSwitching(async () => {
        const { id } = createTab();
        await syncPush(id, '/workbench/welcome', { force: true });
        setActiveTabId(id);
    });
}
</script>

<style scoped></style>
