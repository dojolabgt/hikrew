import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { User } from '@/types';
import { ApiErrorResponse } from './types/api.types';
import { config } from './env';

const API_URL = config.apiUrl;

// Extend InternalAxiosRequestConfig to include _retry flag
interface RetryableRequest extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface LoginResponse {
    message: string;
    user: User;
}

export const login = async (email: string, pass: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password: pass });
    return response.data;
};

export const register = async (userData: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
};

export const logout = async () => {
    await api.post('/auth/logout');
};

export const checkAuth = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (_error) {
        // Silent fail - user is not authenticated
        // This is expected behavior on login page and public routes
        return false;
    }
}

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as RetryableRequest;

        // Don't try to refresh on login, refresh, or logout endpoints
        const skipRefreshUrls = ['/auth/login', '/auth/refresh', '/auth/logout'];
        const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest?.url?.includes(url));

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
            originalRequest._retry = true;

            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login or clear state
                // Don't redirect if we are on a public page
                const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
                const isPublicPath = typeof window !== 'undefined' && publicPaths.some(path => window.location.pathname.startsWith(path));

                if (typeof window !== 'undefined' && !isPublicPath) {
                    // Clear any stored state and redirect if needed
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
