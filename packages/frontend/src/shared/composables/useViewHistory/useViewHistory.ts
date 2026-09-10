import {
    unref,
    reactive,
    readonly,
    computed,
    onUnmounted,
    type InjectionKey,
    type MaybeRef,
} from 'vue';

import { provideLocal, injectLocal } from '@vueuse/core';

import {
    useRouter,
    useRoute,
    type RouteLocationRaw,
    type RouteParamsGeneric,
    type LocationQuery,
} from 'vue-router';

import { resolveDefaultTitle } from '@/shared/utils';

export type ViewHistoryEntry = {
    contextId: string;
    path: string;
    fullPath: string;
    params?: RouteParamsGeneric;
    query?: LocationQuery;
    hash?: string;
    title: string;
};

export type ViewHistoryEntryOpts = Omit<ViewHistoryEntry, 'contextId'>;

export type ViewHistoryEntity = {
    entry: ViewHistoryEntry[];
    cursor: number;
};

export type ViewHistorySyncOpts = {
    force?: boolean;
};

export type ViewHistoryContext = Map<string, ViewHistoryEntity>;

export const ViewHistoryContextKey: InjectionKey<ViewHistoryContext> = Symbol('ViewHistoryContext');

export function useViewHistoryProvider() {
    const store = reactive(new Map<string, ViewHistoryEntity>());
    provideLocal(ViewHistoryContextKey, store);

    const clear = () => {
        store.clear();
    };

    onUnmounted(() => {
        clear();
    });

    return { clear };
}

export function useViewHistory() {
    const store = injectLocal(ViewHistoryContextKey);
    if (!store) {
        throw new Error('useViewHistory 未在 ViewHistoryProvider 上下文中使用');
    }
    const router = useRouter();
    const route = useRoute();

    const push = (contextId: string, payload: ViewHistoryEntryOpts) => {
        let entity = store.get(contextId);

        if (!entity) {
            entity = { entry: [], cursor: -1 };
            store.set(contextId, entity);
        }

        const cnt = entity.entry.length - entity.cursor - 1;
        if (cnt > 0) entity.entry.splice(entity.cursor + 1);
        entity.cursor = entity.entry.length - 1;
        const previousEntry = entity.entry[entity.cursor];
        if (!previousEntry || previousEntry.fullPath !== payload.fullPath) {
            entity.entry.push({ ...payload, contextId });
            entity.cursor = entity.entry.length - 1;
            return true;
        }
        return false;
    };

    const pushNow = (contextId: string) => {
        const { path, fullPath, query, hash, params } = route;
        const title = resolveDefaultTitle(route);
        console.log('pushNow:', { contextId, path, fullPath, query, hash, params, title });
        return push(contextId, {
            path,
            fullPath,
            query,
            hash,
            title,
        });
    };

    const syncPush = async (
        contextId: MaybeRef<string>,
        payload: RouteLocationRaw,
        opts?: ViewHistorySyncOpts
    ) => {
        const { force = false } = opts ?? {};
        const failure = await router.push(payload);
        if (failure && !force) return failure;
        const historyState = pushNow(unref(contextId));
        return {
            failure,
            historyState,
        };
    };

    const back = (contextId: string) => {
        const entity = store.get(contextId);
        if (!entity) return undefined;
        entity.cursor--;
        return entity.entry[entity.cursor];
    };

    const syncBack = (contextId: string) => {
        const { path, query, hash } = back(contextId) ?? {};
        console.log(path, query, hash);
        return router.push({
            path,
            query,
            hash,
        });
    };

    const canBack = (contextId: MaybeRef<string>) => {
        return computed(() => {
            const entity = store.get(unref(contextId));
            if (!entity) return false;
            return entity.cursor > 0;
        });
    };

    const forward = (contextId: string) => {
        const entity = store.get(contextId);
        if (!entity) return undefined;
        entity.cursor++;
        return entity.entry[entity.cursor];
    };

    const syncForward = (contextId: string) => {
        const { path, query, hash } = forward(contextId) ?? {};
        console.log(path, query, hash);
        return router.push({
            path,
            query,
            hash,
        });
    };

    const canForward = (contextId: MaybeRef<string>) => {
        return computed(() => {
            const entity = store.get(unref(contextId));
            if (!entity) return false;
            return entity.cursor < entity.entry.length - 1;
        });
    };

    const go = (contextId: string, delta: number) => {
        const entity = store.get(contextId);
        delta = Math.floor(delta);
        if (!entity || delta > entity.entry.length - 1 || delta < 0) return undefined;
        entity.cursor = delta;
        return entity.entry[entity.cursor];
    };

    const syncGo = (contextId: string, delta: number) => {
        const { path, query, hash } = go(contextId, delta) ?? {};
        return router.push({
            path,
            query,
            hash,
        });
    };

    const canGo = (contextId: MaybeRef<string>, delta: MaybeRef<number>) => {
        return computed(() => {
            const entity = store.get(unref(contextId));
            delta = unref(delta);
            return entity && delta >= 0 && delta <= entity.entry.length - 1;
        });
    };

    const replace = (contextId: string, delta: number, payload: ViewHistoryEntryOpts) => {
        const entity = store.get(contextId);
        if (!entity) return undefined;
        return (entity.entry[delta] = {
            contextId,
            ...payload,
        });
    };

    const replaceNow = (contextId: string, delta?: number) => {
        const { path, fullPath, query, hash, params } = route;
        const title = resolveDefaultTitle(route);
        const entity = store.get(contextId);
        if (!entity) return undefined;
        delta = delta ?? entity.cursor;
        return replace(contextId, delta, {
            path,
            fullPath,
            query,
            hash,
            params,
            title,
        });
    };

    const syncReplace = async (
        contextId: string,
        payload: RouteLocationRaw,
        delta?: number,
        opts?: ViewHistorySyncOpts
    ) => {
        const { force = false } = opts ?? {};
        const failure = await router.replace(payload);
        if (failure && !force) return failure;
        const historyState = replaceNow(contextId, delta);
        return {
            failure,
            historyState,
        };
    };

    const getActiveEntry = (contextId: MaybeRef<string>) => {
        return computed(() => {
            const entity = store.get(unref(contextId));
            if (!entity) return undefined;
            return entity.entry[entity.cursor];
        });
    };

    const getEntity = (contextId: MaybeRef<string>) => {
        return computed(() => {
            const entity = store.get(unref(contextId));
            if (!entity) return undefined;
            return entity;
        });
    };

    const setTitle = (contextId: string, title: string, delta?: number) => {
        const entity = store.get(contextId);
        if (!entity) return false;
        const idx = Math.floor(delta ?? entity.cursor);
        entity.entry[idx].title = title;
        return true;
    };

    return {
        push,
        pushNow,
        syncPush,
        back,
        syncBack,
        canBack,
        forward,
        syncForward,
        canForward,
        go,
        syncGo,
        canGo,
        replace,
        replaceNow,
        syncReplace,
        getActiveEntry,
        getEntity,
        setTitle,
        store: readonly(store),
    };
}
