import { fetchAPI } from './api';

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

export async function getSettings(): Promise<AppSettings> {
    return fetchAPI<AppSettings>('/settings', {
        next: { revalidate: 30 }, // Revalidate every 30 seconds
    });
}
