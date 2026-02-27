import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique filename to prevent collisions
 * Format: {timestamp}-{uuid}{extension}
 * Example: 1707584123456-a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
 *
 * @param originalname - Original filename from upload
 * @returns Unique filename with original extension
 */
export const generateFilename = (originalname: string): string => {
  const ext = extname(originalname);
  const timestamp = Date.now();
  const uniqueId = uuidv4();
  return `${timestamp}-${uniqueId}${ext}`;
};
