import { type RouteLocationNormalizedLoadedGeneric } from 'vue-router';

export function resolveDefaultTitle(
    route: RouteLocationNormalizedLoadedGeneric,
    fallback?: string
) {
    for (let i = route.matched.length - 1; i >= 0; i--) {
        const title = route.matched[i].meta.defaultTitle;
        if (title !== undefined) return title;
    }
    return fallback ?? '新标签页';
}
