/**
 * Result returned after successful file upload
 */
export interface UploadResult {
  url: string; // Public URL of the uploaded file
  filename: string; // Name of the file in storage
  size: number; // File size in bytes
  mimetype: string; // MIME type of the file
}

/**
 * Storage provider interface - all storage implementations must follow this contract
 * This enables the Strategy Pattern for flexible storage backends
 */
export interface IStorageProvider {
  /**
   * Upload a file to storage
   * @param file - The file to upload (from Multer)
   * @param folder - Subfolder to organize files (e.g., 'profile-images')
   * @returns Upload result with URL and metadata
   */
  upload(file: Express.Multer.File, folder: string): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param fileUrl - The URL or path of the file to delete
   */
  delete(fileUrl: string): Promise<void>;

  /**
   * Get the public URL for a file
   * @param filename - The filename in storage
   * @returns Public URL to access the file
   */
  getUrl(filename: string): string;
}
