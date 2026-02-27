import api from '@/lib/auth';

export interface AppSettings {
    id: number;
    appName: string;
    appLogo: string | null;
    appFavicon: string | null;
    primaryColor: string;
    secondaryColor: string;
    allowRegistration: boolean;
    maintenanceMode: boolean;
}

export interface UpdateSettingsDto {
    appName?: string;
    appLogo?: string;
    appFavicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    allowRegistration?: boolean;
    maintenanceMode?: boolean;
}

// Cache for settings
let settingsCache: AppSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Pending request to deduplicate simultaneous calls
let pendingRequest: Promise<AppSettings> | null = null;

export async function getSettings(): Promise<AppSettings> {
    // Return cached data if still valid
    const now = Date.now();
    if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return settingsCache;
    }

    // If there's already a pending request, return it
    if (pendingRequest) {
        return pendingRequest;
    }

    // Create new request
    pendingRequest = api.get<AppSettings>("/settings")
        .then(response => {
            settingsCache = response.data;
            cacheTimestamp = Date.now();
            pendingRequest = null;
            return response.data;
        })
        .catch(error => {
            pendingRequest = null;
            throw error;
        });

    return pendingRequest;
}

/**
 * Update app settings (admin only)
 */
export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await api.patch<AppSettings>("/settings", settings);

    // Invalidate cache after update
    settingsCache = response.data;
    cacheTimestamp = Date.now();

    return response.data;
}

/**
 * Upload app logo (admin only)
 */
export const uploadLogo = async (file: File): Promise<AppSettings> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/settings/logo', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Upload app favicon (admin only)
 */
export const uploadFavicon = async (file: File): Promise<AppSettings> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/settings/favicon', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
