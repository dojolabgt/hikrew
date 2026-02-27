import { BadRequestException } from '@nestjs/common';
import { storageConfig } from '../storage.config';

/**
 * Multer file filter for image validation
 * Validates file type against allowed image types
 *
 * @param req - Express request object
 * @param file - File being uploaded
 * @param callback - Multer callback function
 */
export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  // Check if mimetype matches allowed types
  const mimeTypeRegex = new RegExp(
    `\\/(${storageConfig.allowedImageTypes.join('|')})$`,
  );

  if (!file.mimetype.match(mimeTypeRegex)) {
    return callback(
      new BadRequestException(
        `Solo se permiten imágenes de tipo: ${storageConfig.allowedImageTypes.join(', ')}`,
      ),
      false,
    );
  }

  callback(null, true);
};
