import { useSettings } from '@/hooks/useSettings';
import Image from 'next/image';

interface AppBrandingProps {
    variant?: 'default' | 'compact' | 'login' | 'hero';
    showName?: boolean;
    className?: string;
}

export function AppBranding({
    variant = 'default',
    showName = true,
    className = ''
}: AppBrandingProps) {
    const { settings, isLoading } = useSettings();

    const backendUrl = process.env.NEXT_PUBLIC_IMAGE_BACKEND_URL || 'http://backend:4000';

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
        login: { size: 64, className: 'h-16 w-16' },
        hero: { size: 180, className: 'h-32 w-32 md:h-44 md:w-44' }
    };

    const { size: logoSize, className: logoClassName } = logoSizeMap[variant as keyof typeof logoSizeMap];

    const textSize = {
        compact: 'text-base',
        default: 'text-xl',
        login: 'text-2xl',
        hero: 'text-4xl'
    }[variant as keyof typeof logoSizeMap];

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
                    {settings?.appName || 'NexStack'}
                </span>
            )}
        </div>
    );
}