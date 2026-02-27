import { Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  UploadResult,
} from '../interfaces/storage.interface';
import { storageConfig } from '../storage.config';
import { generateFilename } from '../utils/filename-generator';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Local file system storage provider
 * Implements IStorageProvider for storing files on the local disk
 */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  /**
   * Upload a file to local storage
   * Creates directory if it doesn't exist and saves file with unique name
   */
  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    // Generate unique filename
    const filename = generateFilename(file.originalname);

    // Create full directory path
    const uploadPath = join(storageConfig.uploadDir, folder);

    // Ensure directory exists
    await fs.mkdir(uploadPath, { recursive: true });

    // Full file path
    const filePath = join(uploadPath, filename);

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    // Return upload result
    return {
      url: this.getUrl(`${folder}/${filename}`),
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Delete a file from local storage
   * Handles errors gracefully if file doesn't exist
   */
  async delete(fileUrl: string): Promise<void> {
    try {
      // Extract path from URL (remove /uploads/ prefix)
      const relativePath = fileUrl.replace(/^\/uploads\//, '');
      const filePath = join(storageConfig.uploadDir, relativePath);

      // Delete file
      await fs.unlink(filePath);
    } catch (error) {
      const err = error as { code?: string };
      // Ignore errors if file doesn't exist
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get public URL for a file
   * Returns relative URL that will be served by NestJS static assets
   */
  getUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
