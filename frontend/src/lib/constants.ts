/**
 * Application-wide constants
 */

// Pagination
export const ITEMS_PER_PAGE = 7;

// UI Timing
export const TOAST_DURATION = 4000; // milliseconds
export const DEBOUNCE_DELAY = 300; // milliseconds for search inputs

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Rate Limiting
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_WINDOW = 60000; // 1 minute
export const LOGIN_BLOCK_DURATION = 300000; // 5 minutes

// Cache
export const SETTINGS_CACHE_DURATION = 30000; // 30 seconds

// Validation
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NAME_LENGTH = 100;
