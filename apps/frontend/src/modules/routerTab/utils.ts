import { createRouteTabContext } from '@/shared/composables';

import type { RouteLocationAsRelativeGeneric, RouteLocationAsPathGeneric } from 'vue-router';

export type RouteContextValue = {
    disabled: boolean;
    label: string;
    path: string;
    routerPushPayload?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
};

export const { provideRouteTabContext, useRouteTab } = createRouteTabContext<RouteContextValue>();
