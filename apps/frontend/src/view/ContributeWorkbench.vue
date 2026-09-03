<template>
    <component :is="component" v-for="component in contributeComponents" />
</template>

<script setup lang="ts">
import OverviewContribute from '@/view/overview/Contribute.vue';
import PlaygroundContribute from '@/view/playground/Contribute.vue';

const contributeComponents = [OverviewContribute, PlaygroundContribute];
</script>

<style scoped></style>
