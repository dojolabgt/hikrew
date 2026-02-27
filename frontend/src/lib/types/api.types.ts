import { AxiosError } from 'axios';

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
    message: string;
    statusCode: number;
    error?: string;
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T> {
    data: T;
    message?: string;
}

/**
 * User object returned from auth endpoints
 */
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'team' | 'client';
    profileImage?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Auth response from login endpoint
 */
export interface AuthResponse {
    user: User;
    message?: string;
}

/**
 * Type guard for Axios errors
 */
export type ApiError = AxiosError<ApiErrorResponse>;
