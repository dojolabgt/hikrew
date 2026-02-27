import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { SettingsService } from './core/settings/settings.service';
import { UserRole } from './auth/constants/roles';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const settingsService = app.get(SettingsService);

  const configService = app.get(ConfigService);
  const adminPassword = configService.getOrThrow<string>('SEED_ADMIN_PASSWORD');
  const clientPassword = configService.getOrThrow<string>(
    'SEED_CLIENT_PASSWORD',
  );
  const teamPassword = configService.getOrThrow<string>('SEED_TEAM_PASSWORD');

  const users = [
    {
      email: 'admin@admin.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
    {
      email: 'client@client.com',
      password: clientPassword,
      name: 'Client User',
      role: UserRole.USER,
    },
    {
      email: 'team@team.com',
      password: teamPassword,
      name: 'Team User',
      role: UserRole.TEAM,
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
    } else {
      // Pass plain password; UsersService.create handles hashing
      await usersService.create(userData);
      console.log(`✅ User ${userData.email} created successfully.`);
    }
  }

  // Initialize app settings if they don't exist
  try {
    await settingsService.getSettings();
    console.log('⏭️  App settings already exist.');
  } catch {
    // Settings don't exist, create them with defaults
    const settingsRepository = settingsService['settingsRepository'];
    await settingsRepository.save({
      id: 1,
      appName: 'NexStack',
      appLogo: '/public/branding/NexLogo.png',
      appFavicon: '/public/branding/favicon.ico',
      primaryColor: '#ebebebff',
      secondaryColor: '#252525ff',
      allowRegistration: true,
      maintenanceMode: false,
    });
    console.log('✅ App settings created successfully.');
  }

  await app.close();
  console.log('🌱 Database seeding completed!');
}

void bootstrap();
