import {
    provide,
    inject,
    reactive,
    computed,
    markRaw,
    onUnmounted,
    type Reactive,
    type InjectionKey,
    type Component,
} from 'vue';

import { v7 as uuidv7 } from 'uuid';

import { useTab } from '@/shared/composables/useTab';

export type SlotContextEntity = {
    id: string;
    tabId: string | null;
    component: Component;
    order: number | string;
    enable: boolean;
    stable: boolean;
    keepAlive: boolean;
};

export type SlotContext = Reactive<Map<string, SlotContextEntity[]>>;

export const SlotContextKey: InjectionKey<SlotContext> = Symbol('SlotContext');
export const SlotNamespaceKey: InjectionKey<string> = Symbol('SlotNamespace');

export function useSlotProvider() {
    const store = reactive(new Map<string, SlotContextEntity[]>());
    provide(SlotContextKey, store);

    onUnmounted(() => {
        store.clear();
    });

    const clear = () => {
        store.clear();
    };

    return { clear };
}

function resolveKey(slotName: string, explicitNs?: string): string {
    const injectedNs = inject(SlotNamespaceKey, '');
    const ns = explicitNs ?? injectedNs;
    return ns ? `${ns}:${slotName}` : slotName;
}

export function useSlotTarget(
    slotName: string,
    namespace?: string,
    customCompareFn?: (a: SlotContextEntity, b: SlotContextEntity) => number
) {
    const store = inject(SlotContextKey);
    if (!store) {
        throw new Error(`'useSlotTarget' 必须在提供 'SlotContextKey' 的组件树中使用`);
    }

    const key = resolveKey(slotName, namespace);

    if (!store.has(key)) store.set(key, []);

    const rawSlotEntity = computed(() => {
        console.log(`useSlotTarget: 获取 slot 实体，key=${key}，数量=${store.get(key)?.length}`);
        return store.get(key) ?? [];
    });

    const slotEntity = computed(() => {
        return rawSlotEntity.value.sort(customCompareFn ?? sortCompareFn);
    });

    return { rawSlotEntity, slotEntity };
}

export type UseSlotOptions = {
    id?: string;
    order?: number | string;
    enable?: boolean;
    stable?: boolean;
    keepAlive?: boolean;
    namespace?: string;
};

export type UseSlotSortCompareFn = (a: SlotContextEntity, b: SlotContextEntity) => number;

/**
 * 比较器生成：存入 store 时以优先级高低为默认排序方式
 * 兼容 number 与 string 混合比较
 */
function sortCompareFn(a: SlotContextEntity, b: SlotContextEntity) {
    const ao = a.order;
    const bo = b.order;

    if (typeof ao === 'number' && typeof bo === 'number') {
        return bo - ao;
    }
    if (typeof ao === 'string' && typeof bo === 'string') {
        return ao.localeCompare(bo);
    }
    // number 优先于 string
    return typeof ao === 'number' ? 1 : -1;
}

export function useSlot(slotName: string, component: Component, opts: UseSlotOptions = {}) {
    const store = inject(SlotContextKey);
    if (!store) {
        throw new Error(`'useSlot' 必须在提供 'SlotContextKey' 的组件树中使用`);
    }

    const { activeTabId } = useTab();

    const {
        id = uuidv7(),
        order = 0,
        enable = true,
        stable = false,
        keepAlive = true,
        namespace,
    } = opts;
    const key = resolveKey(slotName, namespace);

    console.log(
        `useSlot: 注册 slot 实体，id=${id}，slotName=${slotName}, activeTabId=${activeTabId.value}`
    );

    const slotEntity = store.get(key) ?? [];

    slotEntity.push({
        id,
        tabId: activeTabId.value,
        component: markRaw(component),
        order,
        enable,
        stable,
        keepAlive,
    });
    slotEntity.sort(sortCompareFn);
    store.set(key, slotEntity);

    const dispose = () => {
        console.log(
            `useSlot: 卸载 slot 实体，id=${id}，slotName=${slotName}, activeTabId=${activeTabId.value}`
        );
        const entries = store.get(key) ?? [];

        const idx = entries.findIndex((e) => e.id === id);
        if (idx === -1) {
            console.warn(`useSlot: 无法找到要卸载的 slot 实体，key=${key}，id=${id}`);
            return;
        }

        entries.splice(idx, 1);
        if (entries.length === 0) store.delete(key);
        else store.set(key, entries);
    };

    onUnmounted(() => {
        dispose();
    });

    return { dispose };
}

export function isAvailableSlot(slotName: string, namespace?: string) {
    return computed(() => {
        const store = inject(SlotContextKey);
        if (!store) {
            throw new Error(`'isAvailableSlot' 必须在提供 'SlotContextKey' 的组件树中使用`);
        }

        const key = resolveKey(slotName, namespace);

        return store.has(key);
    });
}
