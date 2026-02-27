import { useEffect, useState } from 'react';
import { getSettings, type AppSettings } from '@/lib/settings-service';

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Load from local storage immediately if available
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
                setIsLoading(false); // Show content immediately with cached data
            } catch (e) {
                console.error('Failed to parse saved settings', e);
            }
        }

        const loadSettings = async () => {
            try {
                // Only set loading to true if we don't have cached settings
                if (!savedSettings) {
                    setIsLoading(true);
                }

                const data = await getSettings();
                setSettings(data);
                localStorage.setItem('appSettings', JSON.stringify(data));
                setError(null);
            } catch (err) {
                console.error('Failed to load settings:', err);
                setError(err instanceof Error ? err : new Error('Failed to load settings'));
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
