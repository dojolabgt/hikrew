/**
 * Creates a cropped image from the provided image source and crop area
 * @param imageSrc - The source image (base64 or URL)
 * @param pixelCrop - The crop area in pixels
 * @param rotation - Optional rotation in degrees
 * @returns Promise<string> - Base64 string of the cropped image
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const maxSize = 512; // Output size for profile images
    canvas.width = maxSize;
    canvas.height = maxSize;

    // Draw the cropped image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        maxSize,
        maxSize
    );

    // Convert to base64
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
            },
            'image/jpeg',
            0.95 // Quality
        );
    });
}

/**
 * Helper function to create an image element from a source
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}
