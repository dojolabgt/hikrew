import { useMemo } from 'react';
import { getImageUrl } from '@/lib/image-utils';

/**
 * Hook to memoize image URLs
 * Prevents unnecessary recalculations when the image path hasn't changed
 * 
 * @param imagePath - The image path (can be null/undefined)
 * @param fallback - Optional fallback URL if imagePath is null
 * @returns The full image URL or fallback
 * 
 * @example
 * const avatarUrl = useImageUrl(user.avatar, '/default-avatar.png');
 * const logoUrl = useImageUrl(settings.appLogo);
 */
export function useImageUrl(
    imagePath: string | null | undefined,
    fallback?: string
): string | null | undefined {
    return useMemo(() => {
        if (!imagePath) {
            return fallback || null;
        }
        return getImageUrl(imagePath);
    }, [imagePath, fallback]);
}

/**
 * Hook to memoize multiple image URLs
 * Useful when you need to process an array of images
 * 
 * @param imagePaths - Array of image paths
 * @returns Array of full image URLs
 * 
 * @example
 * const imageUrls = useImageUrls(gallery.images);
 */
export function useImageUrls(
    imagePaths: (string | null | undefined)[]
): (string | null | undefined)[] {
    return useMemo(() => {
        return imagePaths.map(path => path ? getImageUrl(path) : null);
    }, [imagePaths]);
}
