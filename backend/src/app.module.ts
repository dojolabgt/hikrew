import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { SettingsModule } from './core/settings/settings.module';
import { MailModule } from './core/mail/mail.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { TokenModule } from './common/token/token.module';
import { BillingModule } from './billing/billing.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ServicesModule } from './services/services.module';
import { ClientsModule } from './clients/clients.module';
import { DealsModule } from './deals/deals.module';
import { ConnectionsModule } from './connections/connections.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(4000),
        FRONTEND_URL: Joi.string().required(),
        FRONTEND_PUBLIC_URL: Joi.string().required(),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        SEED_ADMIN_EMAIL: Joi.string().email().optional(),
        SEED_ADMIN_PASSWORD: Joi.string().optional(),
        SEED_FREELANCER_EMAIL: Joi.string().email().optional(),
        SEED_FREELANCER_PASSWORD: Joi.string().optional(),
        STORAGE_TYPE: Joi.string()
          .valid('local', 's3', 'cloudinary')
          .default('local'),
        UPLOAD_MAX_SIZE: Joi.number().default(5242880),
        ALLOWED_IMAGE_TYPES: Joi.string().default('jpg,jpeg,png,webp,gif'),
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().required(),
        MAIL_USER: Joi.string().allow('').optional(),
        MAIL_PASSWORD: Joi.string().allow('').optional(),
        MAIL_FROM: Joi.string().required(),
        // Nodally encryption
        ENCRYPTION_KEY: Joi.string().length(32).required(),
        // Nodally's own Recurrente keys (for billing freelancers)
        NODALLY_RECURRENTE_PUBLIC_KEY: Joi.string().required(),
        NODALLY_RECURRENTE_SECRET_KEY: Joi.string().required(),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute for general endpoints
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        synchronize: false, // Usage of migrations is recommended for production
        migrationsRun: configService.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),
    StorageModule,
    UsersModule,
    AuthModule,
    SettingsModule,
    MailModule,
    EncryptionModule,
    TokenModule,
    WorkspacesModule,
    BillingModule,
    ServicesModule,
    ClientsModule,
    DealsModule,
    ConnectionsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
