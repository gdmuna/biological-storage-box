import { reactive, readonly, onUnmounted, type InjectionKey } from 'vue';

import { provideLocal, injectLocal } from '@vueuse/core';

import { useTab } from '@/composables';

export type TabCustomContextNamespace = {
    navigation: { path: string; canGoBack: boolean; canForward: boolean };
    session: { visits: number; lastAccess: Date };
};

export type TabCustomContextStore = Map<
    string,
    {
        [Ns in keyof TabCustomContextNamespace]?: TabCustomContextNamespace[Ns];
    }
>;

export type TabCustomContextNamespaceKey = keyof TabCustomContextNamespace;

export const TabCustomContextKey: InjectionKey<TabCustomContextStore> = Symbol('TabCustomContext');

export function useTabCustomContextProvider() {
    const store = reactive<TabCustomContextStore>(new Map());
    provideLocal(TabCustomContextKey, store);

    const clear = () => {
        store.clear();
    };

    onUnmounted(() => {
        clear();
    });

    return { clear };
}

export function useTabCustomContext() {
    const store = injectLocal(TabCustomContextKey);
    if (!store) {
        throw new Error('useTabCustomContext 必须在 TabCustomContextProvider 上下文中使用');
    }
    const { activeTabId } = useTab();

    const get = <Ns extends TabCustomContextNamespaceKey>(
        ns: Ns,
        tabId?: string
    ): TabCustomContextNamespace[Ns] | undefined => {
        tabId = tabId || activeTabId.value;
        const ctx = store.get(tabId);
        if (!ctx) return undefined;
        return ctx[ns];
    };

    const set = <Ns extends TabCustomContextNamespaceKey>(
        ns: Ns,
        payload: TabCustomContextNamespace[Ns],
        tabId?: string
    ) => {
        tabId = tabId || activeTabId.value;
        let ctx = store.get(tabId);
        if (!ctx) {
            ctx = {};
            store.set(tabId, ctx);
        }
        ctx[ns] = payload;
        return set;
    };

    const drop = <Ns extends TabCustomContextNamespaceKey>(ns: Ns, tabId?: string) => {
        tabId = tabId || activeTabId.value;
        const ctx = store.get(tabId);
        if (!ctx) return false;
        delete ctx[ns];
        return true;
    };

    return {
        get,
        set,
        drop,
        store: readonly(store),
    };
}
