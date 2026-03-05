import { useContext, useCallback } from 'react';
import { AuthContext } from '@/features/auth/context/auth-context';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

type LocaleDict = Record<string, any>;

const translations: Record<string, LocaleDict> = {
    'en-US': enTranslations,
    'en': enTranslations,
    'es-GT': esTranslations,
    'es': esTranslations,
};

export function useWorkspaceSettings() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useWorkspaceSettings must be used within an AuthProvider');
    }

    const { activeWorkspace } = context;

    // Defaults fallback
    const language = activeWorkspace?.language || 'es';
    const timezone = activeWorkspace?.timezone || 'America/Guatemala';
    const defaultCurrencyObj = activeWorkspace?.currencies?.find((c: any) => c.isDefault) ||
        activeWorkspace?.currencies?.[0] ||
        { code: 'GTQ', symbol: 'Q', name: 'Quetzal' };

    const defaultCurrencyCode = defaultCurrencyObj.code;

    /**
     * Simple flat translation fetcher
     * Usage: t('common.save')
     */
    const t = useCallback((key: string): string => {
        let dict = translations[language] || translations['es']; // Fallback to Spanish
        if (!translations[language]) {
            // Try fallback to just language part if it was en-US etc
            const baseLang = language.split('-')[0];
            dict = translations[baseLang] || translations['es'];
        }

        const keys = key.split('.');
        let value: any = dict;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return the key itself if not found
            }
        }

        return typeof value === 'string' ? value : key;
    }, [language]);

    /**
     * Formatting logic for currency
     */
    const formatCurrencyValue = useCallback((amount: number, currencyCode: string = defaultCurrencyCode) => {
        const localeToUse = language === 'en' || language === 'en-US' ? 'en-US' : 'es-GT';

        return new Intl.NumberFormat(localeToUse, {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    }, [language, defaultCurrencyCode]);

    /**
     * Formatting logic for dates
     */
    const formatDateValue = useCallback((date: Date | string | number) => {
        const localeToUse = language === 'en' || language === 'en-US' ? 'en-US' : 'es-GT';
        const d = new Date(date);

        return new Intl.DateTimeFormat(localeToUse, {
            timeZone: timezone,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(d);
    }, [language, timezone]);

    const activeTaxes = activeWorkspace?.taxes?.filter((t: any) => t.isActive) || [];
    const defaultTaxes = activeTaxes.filter((t: any) => t.isDefault);

    return {
        workspace: activeWorkspace,
        language,
        timezone,
        defaultCurrencyCode,
        defaultCurrencyObj,
        activeTaxes,
        defaultTaxes,
        t,
        formatCurrency: formatCurrencyValue,
        formatDate: formatDateValue,
    };
}
