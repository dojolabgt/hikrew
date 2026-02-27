import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { storageConfig } from './storage.config';
import { IStorageProvider } from './interfaces/storage.interface';

/**
 * Storage module with dynamic provider selection
 * Uses Factory Provider pattern to select storage backend based on environment
 */
@Module({
  providers: [
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (): IStorageProvider => {
        const type = storageConfig.storageType;

        switch (type) {
          case 'local':
            return new LocalStorageProvider();
          // Future providers can be added here:
          // case 's3':
          //   return new S3StorageProvider();
          // case 'cloudinary':
          //   return new CloudinaryProvider();
          default:
            return new LocalStorageProvider();
        }
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
