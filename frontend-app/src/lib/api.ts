import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from './types/api.types';

// Use PUBLIC_URL if available (for standard web requests), fallback to internal URL or localhost
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL,
    withCredentials: true, // Crucial for sending/receiving HttpOnly cookies (access_token, refresh_token)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach CSRF tokens or tenant headers if needed in the future
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');

            // Do not send x-workspace-id on auth routes (login, register, refresh) to prevent CORS issues
            const isAuthRoute = config.url?.startsWith('/auth/') || config.url?.includes('auth');
            if (activeWorkspaceId && !isAuthRoute) {
                config.headers['x-workspace-id'] = activeWorkspaceId;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Unwrap ApiResponse<T> and handle 401s for silent refresh
api.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
        // Backend always returns { success: true, data: T }
        // We unwrap it here so frontend services only deal with T directly.
        if (response.data && 'success' in response.data && 'data' in response.data) {
            // Replace the full response data with just the payload T
            response.data = response.data.data;
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized (Token Expired)
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to quietly refresh the token using the refresh cookie
                await axios.post(
                    `${baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true } // Must send cookies to the auth endpoint
                );

                // If successful, retry the original failed request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (refresh token expired or invalid)
                // App should log out the user, but we can't cleanly use hooks here.
                // We'll dispatch a custom event or redirect if on browser.
                if (typeof window !== 'undefined') {
                    // Optional: Dispatch a custom logout event
                    window.dispatchEvent(new Event('auth-logout'));
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
