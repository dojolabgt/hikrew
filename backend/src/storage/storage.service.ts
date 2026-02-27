import { Inject, Injectable } from '@nestjs/common';
import type { IStorageProvider } from './interfaces/storage.interface';
import { UploadResult } from './interfaces/storage.interface';

/**
 * Storage service - Context in Strategy Pattern
 * Delegates all operations to the active storage provider
 * This allows switching between storage backends without changing business logic
 */
@Injectable()
export class StorageService {
  constructor(
    @Inject('STORAGE_PROVIDER') private readonly provider: IStorageProvider,
  ) {}

  /**
   * Upload a file using the active storage provider
   */
  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    return this.provider.upload(file, folder);
  }

  /**
   * Delete a file using the active storage provider
   */
  async delete(fileUrl: string): Promise<void> {
    return this.provider.delete(fileUrl);
  }

  /**
   * Get public URL for a file
   */
  getUrl(filename: string): string {
    return this.provider.getUrl(filename);
  }
}
