import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import vueHook from 'alova/vue';
import { getAccessToken, setAccessToken, callRefreshToken } from './token';

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
        const token = getAccessToken();
        if (token) {
            if (!method.config.headers) method.config.headers = {};
            (method.config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    },
    responded: {
        onSuccess: async (response: Response) => {
            if (response.status === 401) {
                // Silently attempt to refresh the access token for the *next* request.
                // The current request is still rejected so callers can react (e.g. redirect to login).
                const newToken = await callRefreshToken();
                if (newToken) {
                    setAccessToken(newToken);
                } else {
                    setAccessToken(null);
                }
                throw new Error('Unauthorized');
            }
            const json: ApiResponse = await response.json();
            if (!json.success) throw new Error(json.message || 'API Error');
            return json.data;
        },
        onError: (err: Error) => {
            throw err;
        },
    },
});
