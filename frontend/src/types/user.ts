import { UserRole } from './auth';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    profileImage?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface CreateUser {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}

export type UpdateUser = Partial<CreateUser>;
