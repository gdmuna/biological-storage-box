import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import vueHook from 'alova/vue';

interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data: T;
}

export const alovaInstance = createAlova({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    statesHook: vueHook,
    requestAdapter: adapterFetch(),
    beforeRequest(method) {
        method.config.credentials = 'include';
    },
    responded: {
        onSuccess: async (response: Response) => {
            const json: ApiResponse = await response.json();
            if (!json.success) throw new Error(json.message || 'API Error');
            return json.data;
        },
        onError: (err: Error) => {
            throw err;
        },
    },
});
