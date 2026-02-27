import { join } from 'path';

/**
 * Storage configuration
 * Centralized settings for file uploads and storage
 */
export class StorageConfig {
  static get uploadDir(): string {
    return join(process.cwd(), 'uploads');
  }

  static get maxFileSize(): number {
    return parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10);
  }

  static get allowedImageTypes(): string[] {
    return (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,webp,gif')
      .split(',')
      .map((type) => type.trim());
  }

  static get storageType(): string {
    return process.env.STORAGE_TYPE || 'local';
  }

  static get folders() {
    return {
      profileImages: 'profile-images',
      documents: 'documents',
      temp: 'temp',
      appAssets: 'app-assets',
    };
  }
}

export const storageConfig = StorageConfig;
