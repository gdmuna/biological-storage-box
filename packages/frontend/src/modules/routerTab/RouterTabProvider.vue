<template>
    <slot />
</template>

<script setup lang="ts">
import { provideRouteTabContext } from './utils';

provideRouteTabContext();
</script>

<style scoped></style>
