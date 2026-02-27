import { useEffect, useState } from 'react';
import { getSettings, type AppSettings } from '@/features/app-settings/services/settings-service';

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                // First check cache
                const cached = localStorage.getItem('app-settings-cache');
                if (cached) {
                    setSettings(JSON.parse(cached));
                    setIsLoading(false); // Show cached content immediately
                }

                const data = await getSettings();

                // Update cache if data changed
                if (JSON.stringify(data) !== cached) {
                    setSettings(data);
                    localStorage.setItem('app-settings-cache', JSON.stringify(data));
                }

                setError(null);
            } catch (err) {
                console.error('Failed to load settings:', err);
                if (!localStorage.getItem('app-settings-cache')) {
                    setError(err instanceof Error ? err : new Error('Failed to load settings'));
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();

        // Poll for settings changes every 30 seconds
        const interval = setInterval(loadSettings, 30000);

        return () => clearInterval(interval);
    }, []);

    return { settings, isLoading, error };
}
