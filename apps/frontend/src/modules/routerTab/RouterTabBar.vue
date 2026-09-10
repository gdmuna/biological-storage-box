<template>
    <ScrollArea type="auto" class="min-w-0">
        <div class="flex">
            <RouterTabItem
                v-for="item in tabEntity"
                :id="item.id"
                :key="item.id"
                :label="item.value.label"
                :disabled="item.value.disabled"
                :data-active="resolveActiveState(item.value)"
                @click="handleClick(item.id)"
            />
        </div>
        <ScrollBar orientation="horizontal" class="h-2" />
    </ScrollArea>
</template>

<script setup lang="ts">
import { useRouteTab, type RouteContextValue } from './utils';
import RouterTabItem from './RouterTabItem.vue';

import { matchesRoutePath } from '@/shared/utils';

import { ScrollArea, ScrollBar } from '@/ui/scroll-area';

import { useRouter, useRoute } from 'vue-router';

const route = useRoute();

interface Props {
    activeStateResolver?: (value: RouteContextValue) => boolean;
}

const props = defineProps<Props>();

function resolveActiveState(value: RouteContextValue) {
    return props.activeStateResolver?.(value) ?? matchesRoutePath(route.path, { type: 'prefix', value: value.path });
}

const { tabEntity, getEntity } = useRouteTab();

const router = useRouter();

function handleClick(tid: string) {
    const item = getEntity(tid);
    if (!item) return;
    router.push(item.value.routerPushPayload ?? item.value.path);
}
</script>

<style scoped></style>
