/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { UserRole } from './../src/auth/constants/roles';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let adminAccessToken: string;
  let userAccessToken: string;
  let createdUserId: string;
  let adminUserId: string;

  const adminUser = {
    email: `users_admin_${Date.now()}@test.com`,
    password: 'TestAdmin123!',
    name: 'Users Admin',
    role: UserRole.ADMIN,
  };

  const newUser = {
    email: `testuser${Date.now()}@example.com`,
    password: 'TestUser123!',
    name: 'Test User',
    role: 'user', // "user" role is what we expect to create via API
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

    // 0. Create Dynamic Admin
    const createdAdmin = await usersService.create(adminUser);
    adminUserId = createdAdmin.id;

    // 1. Login as Admin
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      })
      .expect(200);

    // Extract cookie
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    if (!cookies) throw new Error('No cookies returned for admin login');

    const authCookie = cookies.find((c) => c.startsWith('Authentication='));
    if (!authCookie) throw new Error('No Authentication cookie found');

    adminAccessToken = authCookie.split(';')[0];

    // 2. Create New User via Admin
    const createRes = await request(app.getHttpServer())
      .post('/users')
      .set('Cookie', [adminAccessToken])
      .send(newUser)
      .expect(201);

    createdUserId = createRes.body.id;

    // 3. Login as New User
    const userLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: newUser.email,
        password: newUser.password,
      })
      .expect(200);

    const userCookies = userLoginRes.headers[
      'set-cookie'
    ] as unknown as string[];
    const userAuthCookie = userCookies.find((c) =>
      c.startsWith('Authentication='),
    );
    if (!userAuthCookie)
      throw new Error('No Authentication cookie found for user login');
    userAccessToken = userAuthCookie.split(';')[0];
  });

  afterAll(async () => {
    // Cleanup: Delete created user
    if (createdUserId) {
      await usersService.remove(createdUserId);
    }
    // Cleanup: Delete dynamic admin
    if (adminUserId) {
      await usersService.remove(adminUserId);
    }
    await app.close();
  });

  it('/users/profile (PATCH)', () => {
    return request(app.getHttpServer())
      .patch('/users/profile')
      .set('Cookie', [userAccessToken])
      .send({
        name: 'Updated Name',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toEqual('Updated Name');
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('/users/profile (PATCH) - Unauthorized', () => {
    return request(app.getHttpServer())
      .patch('/users/profile')
      .send({
        name: 'Updated Name',
      })
      .expect(401);
  });

  it('/users/change-password (PATCH)', async () => {
    const newPassword = 'NewPassword123!';

    // Change password
    await request(app.getHttpServer())
      .patch('/users/change-password')
      .set('Cookie', [userAccessToken])
      .send({
        currentPassword: newUser.password,
        password: newPassword,
      })
      .expect(200);

    // Try login with OLD password (should fail)
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: newUser.email,
        password: newUser.password,
      })
      .expect(401);

    // Try login with NEW password (should succeed)
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: newUser.email,
        password: newPassword,
      })
      .expect(200);

    // Reset password back for consistency if other tests relied on it (though we are done)
  });

  it('/users (GET) - RBAC check: User cannot access Admin route', async () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Cookie', [userAccessToken])
      .expect(403);
  });

  it('/users/:id (DELETE) - RBAC check: User cannot delete users', async () => {
    // Trying to delete themselves or anyone else
    return request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .set('Cookie', [userAccessToken])
      .expect(403);
  });
});
