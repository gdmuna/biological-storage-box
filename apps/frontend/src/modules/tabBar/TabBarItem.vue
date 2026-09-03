<template>
    <Button class="bg-neutral-100 data-[activated=true]:bg-neutral-200 hover:bg-neutral-300 text-card-foreground rounded-none p-0">
        <div class="flex shrink-0 min-h-8 max-w-max items-center gap-2 px-2 py-1">
            <p class="truncate max-w-32">
                <slot />
            </p>
            <Button variant="ghost" class="size-5 p-2! hover:bg-neutral-200" @click.stop="$emit('close')">
                <X class="size-3.5" />
            </Button>
        </div>
    </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { X } from '@lucide/vue';

// interface Props {
//     label: string;
// }

// withDefaults(defineProps<Props>(), {});

defineEmits<{
    close: [];
}>();
</script>

<style scoped></style>
