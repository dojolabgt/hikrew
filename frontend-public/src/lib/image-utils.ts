const API_URL = process.env.NEXT_PUBLIC_IMAGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Get the full URL for a profile image
 * @param imageUrl - The image URL from the backend (e.g., "/uploads/profile-images/...")
 * @returns Full URL with API prefix, or undefined if no image
 */
export function getImageUrl(imageUrl: string | null | undefined): string | undefined {
    if (!imageUrl) return undefined;

    // If it's already a full URL (starts with http), return as is
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }

    // If it's a base64 data URL, return as is
    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    // Otherwise, prepend the API URL
    return `${API_URL}${imageUrl}`;
}
