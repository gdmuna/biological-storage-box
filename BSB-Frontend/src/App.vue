<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from '@/components/ui/sonner';
</script>

<template>
    <RouterView />
    <Toaster position="top-right" rich-colors />
</template>
