import {
    ref,
    unref,
    readonly,
    reactive,
    computed,
    watch,
    watchEffect,
    onUnmounted,
    type Ref,
    type MaybeRef,
    type Reactive,
    type InjectionKey,
    type Component,
} from 'vue';

import { provideLocal, injectLocal, toRef } from '@vueuse/core';

type TabId = string;

export type NullableTabId = TabId | undefined | null;

type Path = string;

export type TabComponentContextEntity = {
    tabId: TabId;
    path: Path;
    component: Component;
};

export type TabComponentProviderConf = {
    disableWhenTabNull?: boolean;
};

export type TabComponentContextState = 'idle' | 'switching';

export type TabComponentContext = {
    store: Reactive<Map<TabId, Map<Path, TabComponentContextEntity>>>;
    conf: Ref<TabComponentProviderConf | undefined>;
    state: Ref<TabComponentContextState>;
    setState: (state: TabComponentContextState) => void;
    createTabRule: ReadonlySet<RegExp>;
    setCreateTabRule: (pattern: RegExp) => void;
    deleteCreateTabRule: (pattern: RegExp) => boolean;
};

export const TabComponentContextKey: InjectionKey<TabComponentContext> =
    Symbol('TabComponentContext');

export function useTabComponentProvider(opts?: MaybeRef<TabComponentProviderConf>) {
    const store = reactive(new Map<TabId, Map<Path, TabComponentContextEntity>>());

    const _state = ref<TabComponentContextState>('idle');
    const state = readonly(_state);
    const setState = (state: TabComponentContextState) => {
        _state.value = state;
    };

    const _createTabRule = reactive(new Set<RegExp>());
    const createTabRule = readonly(_createTabRule);
    const setCreateTabRule = (pattern: RegExp) => {
        _createTabRule.add(pattern);
    };
    const deleteCreateTabRule = (pattern: RegExp) => {
        return _createTabRule.delete(pattern);
    };

    const resolvedOpts = toRef(opts);
    provideLocal(TabComponentContextKey, {
        store,
        conf: resolvedOpts,
        state,
        setState,
        createTabRule,
        setCreateTabRule,
        deleteCreateTabRule,
    });

    const clear = () => {
        store.clear();
        _createTabRule.clear();
    };

    onUnmounted(() => {
        clear();
    });

    return {
        clear,
        state,
        setState,
        createTabRule,
        setCreateTabRule,
        deleteCreateTabRule,
    };
}

export function useTabComponent() {
    const ctx = injectLocal(TabComponentContextKey);
    if (!ctx) {
        throw new Error('useTabComponent 未在 TabComponentProvider 上下文中使用');
    }

    const { store, conf, state, setState, createTabRule, setCreateTabRule, deleteCreateTabRule } =
        ctx;

    const resolveTabId = (tabId: MaybeRef<NullableTabId> = null) => {
        return computed(() => unref(tabId) ?? '__NULL__');
    };

    const resolveComponentKey = (tabId: MaybeRef<NullableTabId> = null, path: MaybeRef<Path>) => {
        const resolvedTabId = resolveTabId(tabId);
        const resolvedPath = toRef(path);
        return computed(() => `${resolvedTabId.value}:${resolvedPath.value}`);
    };

    const register = (
        tabId: MaybeRef<NullableTabId> = null,
        path: MaybeRef<Path>,
        component: MaybeRef<Component>
    ) => {
        const resolvedTabId = resolveTabId(tabId);
        const resolvedPath = toRef(path);

        const handler = watchEffect(() => {
            const tid = resolvedTabId.value;
            // if (conf.value?.disableWhenTabNull && tid === '__NULL__') return;

            const p = resolvedPath.value;
            const rawComponent = unref(component);

            console.log({ tid, p });

            let entityMap = store.get(tid);
            if (!entityMap) {
                entityMap = new Map<Path, TabComponentContextEntity>();
                store.set(tid, entityMap);
            }
            entityMap.set(p, { tabId: tid, path: p, component: rawComponent });
            console.log('注册 tab 组件', { tid, p, rawComponent });
        });

        watch(
            state,
            (value) => {
                if (value === 'switching') handler.pause();
                if (value === 'idle') handler.resume();
            },
            { flush: 'sync' }
        );

        return handler;
    };

    const render = (tabId: MaybeRef<NullableTabId> = null, path: MaybeRef<Path>) => {
        const resolvedTabId = resolveTabId(tabId);
        const resolvedPath = toRef(path);

        const key = resolveComponentKey(tabId, path);
        return computed(() => {
            const entity = store.get(resolvedTabId.value)?.get(resolvedPath.value);
            return {
                Component: entity?.component,
                key: key.value,
            };
        });
    };

    const drop = (payload: { tabId?: NullableTabId; path?: Path }) => {
        const { tabId, path } = payload;
        const resolvedTabId = resolveTabId(tabId).value;

        if (path) {
            const context = store.get(resolvedTabId);
            if (!context) return false;
            return context.delete(path);
        }
        return store.delete(resolvedTabId);
    };

    const withSwitching = async (callback: () => any | Promise<any>) => {
        try {
            setState('switching');
            await callback();
        } finally {
            setState('idle');
        }
    };

    return {
        resolveTabId,
        resolveComponentKey,
        register,
        render,
        drop,
        state,
        setState,
        createTabRule,
        setCreateTabRule,
        deleteCreateTabRule,
        withSwitching,
        store: readonly(store),
    };
}
