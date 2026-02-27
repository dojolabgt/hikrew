import { User } from './user';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    TEAM = 'team',
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name: string;
}

export interface LoginResponse {
    message: string;
    user: User;
}

export interface RegisterResponse {
    message: string;
}

export interface AuthResponse {
    user: User;
}
