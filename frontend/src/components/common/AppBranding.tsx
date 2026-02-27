import { useSettings } from '@/hooks/useSettings';
import Image from 'next/image';
import { config } from '@/lib/env';

interface AppBrandingProps {
    variant?: 'default' | 'compact' | 'login';
    showName?: boolean;
    className?: string;
}

export function AppBranding({
    variant = 'default',
    showName = true,
    className = ''
}: AppBrandingProps) {
    const { settings, isLoading } = useSettings();

    const backendUrl = config.imageBackendUrl || config.apiUrl;

    if (isLoading) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                {showName && <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />}
            </div>
        );
    }

    let logoUrl = null;

    if (settings?.appLogo) {
        if (settings.appLogo.startsWith('http') || settings.appLogo.startsWith('data:')) {
            logoUrl = settings.appLogo;
        } else {
            const cleanPath = settings.appLogo.startsWith('/')
                ? settings.appLogo.slice(1)
                : settings.appLogo;
            const cleanBase = backendUrl.endsWith('/')
                ? backendUrl.slice(0, -1)
                : backendUrl;

            logoUrl = `${cleanBase}/${cleanPath}`;
        }
    }

    const logoSizeMap = {
        compact: { size: 32, className: 'h-8 w-8' },
        default: { size: 40, className: 'h-10 w-10' },
        login: { size: 64, className: 'h-16 w-16' }
    };

    const { size: logoSize, className: logoClassName } = logoSizeMap[variant];

    const textSize = {
        compact: 'text-base',
        default: 'text-xl',
        login: 'text-2xl'
    }[variant];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {logoUrl && (
                <div className={`relative ${logoClassName}`}>
                    <Image
                        src={logoUrl}
                        alt={settings?.appName || 'Logo'}
                        width={logoSize}
                        height={logoSize}
                        className="object-contain"
                        priority={variant === 'login'}
                    />
                </div>
            )}
            {showName && (
                <span className={`font-bold ${textSize}`}>
                    {settings?.appName || 'Dashboard'}
                </span>
            )}
        </div>
    );
}