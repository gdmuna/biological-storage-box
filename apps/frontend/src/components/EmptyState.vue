<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}>();
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-bsb-border-standard bg-bsb-bg-surface/50 py-14 text-center">
        <component :is="props.icon" v-if="props.icon" class="size-10 text-bsb-text-quaternary" />
        <p class="text-sm font-medium text-bsb-text-secondary">{{ props.title }}</p>
        <p v-if="props.description" class="max-w-xs text-xs text-bsb-text-quaternary">{{ props.description }}</p>
        <Button v-if="props.actionLabel && props.onAction" size="sm" variant="outline" class="mt-1 gap-1.5 border-bsb-border-standard" @click="props.onAction">
            {{ props.actionLabel }}
        </Button>
    </div>
</template>
