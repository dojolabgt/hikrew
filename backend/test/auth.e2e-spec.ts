/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { UserRole } from './../src/auth/constants/roles';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let adminUserId: string;

  const adminUser = {
    email: `auth_admin_${Date.now()}@test.com`,
    password: 'TestAdmin123!',
    name: 'Auth Admin',
    role: UserRole.ADMIN,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    usersService = app.get(UsersService);
    const user = await usersService.create(adminUser);
    adminUserId = user.id;
  });

  afterAll(async () => {
    if (adminUserId) {
      await usersService.remove(adminUserId);
    }
    await app.close();
  });

  it('/auth/login (POST) - Admin Login', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toEqual('Login successful');
        expect(res.body.user).toHaveProperty('email', adminUser.email);
        // Expect cookies
        const cookies = res.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeDefined();
        expect(
          cookies.some((c) => c.startsWith('Authentication=')),
        ).toBeTruthy();
        expect(cookies.some((c) => c.startsWith('Refresh='))).toBeTruthy();
      });
  });

  it('/auth/login (POST) - Invalid Credentials', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });
});
