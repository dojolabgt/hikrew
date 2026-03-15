import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { SettingsService } from './core/settings/settings.service';
import { WorkspacesService } from './workspaces/workspaces.service';
import { UserRole } from './auth/constants/roles';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const settingsService = app.get(SettingsService);
  const workspacesService = app.get(WorkspacesService);
  const configService = app.get(ConfigService);

  // All credentials come from env — easy to configure per environment
  const adminEmail = configService.getOrThrow<string>('SEED_ADMIN_EMAIL');
  const adminPassword = configService.getOrThrow<string>('SEED_ADMIN_PASSWORD');
  const freelancerEmail = configService.getOrThrow<string>(
    'SEED_FREELANCER_EMAIL',
  );
  const freelancerPassword = configService.getOrThrow<string>(
    'SEED_FREELANCER_PASSWORD',
  );

  const users = [
    {
      email: adminEmail,
      password: adminPassword,
      firstName: 'Krew',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      email: freelancerEmail,
      password: freelancerPassword,
      firstName: 'Test',
      lastName: 'Freelancer',
      role: UserRole.FREELANCER,
    },
  ];

  for (const userData of users) {
    const existingUser = await usersService.findOneByEmail(userData.email);

    if (existingUser) {
      console.log(`⏭️  User ${userData.email} already exists.`);
      if (existingUser.role !== userData.role) {
        await usersService.updateByAdmin(existingUser.id, {
          role: userData.role,
        });
        console.log(
          `🔄 Updated role for ${userData.email} to ${userData.role}`,
        );
      }

      // Ensure Workspace exists for FREELANCER seed users
      if (userData.role === UserRole.FREELANCER) {
        const workspaces = await workspacesService.findByUserId(
          existingUser.id,
        );
        if (workspaces.length > 0) {
          console.log(`⏭️  Workspace already exists for ${userData.email}`);
        } else {
          await workspacesService.createDefaultWorkspace(existingUser.id);
          console.log(`✅ Default Workspace created for ${userData.email}`);
        }
      }
    } else {
      const newUser = await usersService.create(userData);
      console.log(`✅ User ${userData.email} created successfully.`);

      // Auto-create Workspace for freelancer seed users
      if (userData.role === UserRole.FREELANCER) {
        await workspacesService.createDefaultWorkspace(newUser.id);
        console.log(`✅ Default Workspace created for ${userData.email}`);
      }
    }
  }

  // Initialize app settings if they don't exist
  try {
    await settingsService.getSettings();
    console.log('⏭️  App settings already exist.');
  } catch {
    const settingsRepository = settingsService['settingsRepository'];
    await settingsRepository.save({
      id: 1,
      appName: 'Hi Krew',
      appLogo: '/public/branding/HiKrewLogo.png',
      appFavicon: '/public/branding/HiKrewLogo.png',
      primaryColor: '#6366f1',
      secondaryColor: '#1e1b4b',
      allowRegistration: true,
      maintenanceMode: false,
    });
    console.log('✅ App settings created successfully.');
  }

  await app.close();
  console.log('🌱 Database seeding completed!');
}

void bootstrap();
