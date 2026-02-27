import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/lib/types/api.types';

/**
 * Type guard to check if an error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
    return (error as AxiosError).isAxiosError === true;
}

/**
 * Type guard to check if an error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
    return typeof (error as { message?: string }).message === 'string';
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        return error.response?.data?.message || error.message || 'An error occurred';
    }

    if (hasMessage(error)) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
}
