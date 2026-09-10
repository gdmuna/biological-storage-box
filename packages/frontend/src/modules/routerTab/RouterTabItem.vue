<template>
    <Button
        variant="ghost"
        class="h-10 w-auto max-w-48 shrink-0 rounded-none border-b-2 border-transparent hover:bg-transparent text-muted-foreground data-[active=false]:hover:text-foreground cursor-pointer data-[active=true]:border-primary data-[active=true]:text-primary"
        :title="label"
    >
        <span class="truncate">{{ label }}</span>
    </Button>
</template>

<script setup lang="ts">
import { Button } from '@/ui/button';

interface Props {
    label?: string;
    disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
    label: 'unknown',
    disabled: false,
});
</script>

<style scoped></style>
