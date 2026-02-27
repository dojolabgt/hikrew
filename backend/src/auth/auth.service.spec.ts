import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from './constants/roles';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockUsersService = () => ({
  findOneByEmailWithPassword: jest.fn(),
  updateRefreshToken: jest.fn(),
  findOneById: jest.fn(),
  update: jest.fn(),
});

const mockJwtService = () => ({
  signAsync: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn().mockReturnValue('super-secret'),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    usersService = module.get(UsersService);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if validation succeeds', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedPassword',
        name: 'Test',
        role: UserRole.USER,
        refreshToken: null,
      };

      usersService.findOneByEmailWithPassword.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual({
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        role: UserRole.USER,
      });
    });

    it('should return null if password does not match', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.USER,
      };

      usersService.findOneByEmailWithPassword.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@test.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(null);
      const result = await service.validateUser(
        'notfound@test.com',
        'password',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and refresh_token', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        role: UserRole.USER,
        name: 'Test',
      };
      jwtService.signAsync.mockResolvedValue('token');

      // Mock hash for refresh token updates
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRt');

      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken', 'token');
      expect(result).toHaveProperty('refreshToken', 'token');
      expect(usersService.update).toHaveBeenCalled();
    });
  });
});
