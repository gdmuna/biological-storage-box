<template>
    <div id="app-container ">
        <RouterView />
    </div>
</template>

<script setup lang="ts">
import { useTabProvider, useTab, useTabComponentProvider, useSlotProvider, useViewHistoryProvider } from '@/composables';

useTabProvider();

useTabComponentProvider();

useSlotProvider();

useViewHistoryProvider();

// const { createTab, setActiveTabId } = useTab();

// const { id } = createTab();
// setActiveTabId(id);
</script>
