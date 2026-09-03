<template>
    <div v-for="value in Array.from({ length: 100 })">Man!what can I say.</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';

onMounted(() => {
    console.log('Component <WorkbenchWelcome> mounted');
});

onUnmounted(() => {
    console.log('Component <WorkbenchWelcome> unmounted');
});

onActivated(() => {
    console.log('Component <WorkbenchWelcome> activated');
});

onDeactivated(() => {
    console.log('Component <WorkbenchWelcome> deactivated');
});
</script>

<style scoped></style>
