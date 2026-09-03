<template>
    <Button variant="ghost" :disabled="!canBack(contextId).value" class="size-7 hover:bg-neutral-200" @click="syncBack(contextId)">
        <slot name="back" />
    </Button>
    <Button variant="ghost" :disabled="!canForward(contextId).value" class="size-7 hover:bg-neutral-200" @click="syncForward(contextId)">
        <slot name="forward" />
    </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useViewHistory } from '@/composables';
import { watch, computed } from 'vue';

interface Props {
    contextId: string;
}

const props = withDefaults(defineProps<Props>(), {});

const { syncBack, canBack, syncForward, canForward } = useViewHistory();

const CanBack = canBack(computed(() => props.contextId));

const CanForward = canForward(computed(() => props.contextId));

watch(
    () => [CanBack.value, CanForward.value],
    ([newCanBack, newCanForward]) => {
        console.log('[newCanBack, newCanForward]:', [newCanBack, newCanForward]);
    },
    { immediate: true }
);
</script>

<style scoped></style>
