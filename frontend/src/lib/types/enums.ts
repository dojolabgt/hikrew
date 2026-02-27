/**
 * Application-wide enums
 */

/**
 * User roles in the system
 */
export enum UserRole {
    ADMIN = 'admin',
    TEAM = 'team',
    USER = 'user',
}

/**
 * User role display names (Spanish)
 */
export const UserRoleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.TEAM]: 'Equipo',
    [UserRole.USER]: 'Usuario',
};

/**
 * Badge styles for user roles
 */
export const UserRoleBadgeStyles: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    [UserRole.TEAM]: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    [UserRole.USER]: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
};

/**
 * HTTP Status codes
 */
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

/**
 * Toast types
 */
export enum ToastType {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
}
