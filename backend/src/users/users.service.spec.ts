import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  manager: {
    transaction: jest.fn(),
  },
});

const mockStorageService = () => ({
  delete: jest.fn(),
  upload: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn(),
});

type MockRepository = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  manager: {
    transaction: jest.Mock;
  };
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
        {
          provide: StorageService,
          useFactory: mockStorageService,
        },
        {
          provide: ConfigService,
          useFactory: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const savedUser = {
        id: 'uuid',
        ...userData,
        password: 'hashedPassword',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(userData);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name,
        }),
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedUser);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      const user = { id: 'uuid', email: 'test@example.com' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(user);
    });

    it('should return null if not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.findOneByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });
});
