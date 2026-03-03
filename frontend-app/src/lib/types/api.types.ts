import { UserRole } from "./enums";
import { WorkspaceMember } from "@/features/workspaces/types";

/**
 * The canonical User entity representation returned by the backend.
 * Uses the strict `UserRole` enum instead of a generic string.
 */
export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    status: 'active' | 'inactive';
    profileImage?: string;
    authProviders?: string[]; // e.g. ['password', 'google']
    hasPassword?: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    workspaceMembers?: WorkspaceMember[];
}

/**
 * Standard API response envelope (matches NestJS backend interceptor)
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
}

/**
 * Paginated API response structure
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

/**
 * Standard API error structure from the backend
 */
export interface ApiError {
    statusCode: number;
    message: string | string[];
    error: string;
}
