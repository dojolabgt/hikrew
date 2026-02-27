import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StorageService } from '../storage/storage.service';
import { storageConfig } from '../storage/storage.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'name',
        'role',
        'profileImage',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    // Exclude sensitive data by default for general queries
    return this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'role',
        'profileImage',
        'createdAt',
        'updatedAt',
        'refreshToken',
      ],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const dataToCreate = { ...userData };
    if (dataToCreate.password) {
      dataToCreate.password = await this.hashPassword(dataToCreate.password);
    }
    const user = this.usersRepository.create(dataToCreate);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'email',
        'name',
        'role',
        'profileImage',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    await this.usersRepository.update(id, updateProfileDto);
    return this.findOneById(id) as Promise<User>;
  }

  async updateByAdmin(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const dataToUpdate = { ...updateUserDto };
    if (dataToUpdate.password) {
      dataToUpdate.password = await this.hashPassword(dataToUpdate.password);
    }
    await this.usersRepository.update(id, dataToUpdate);
    return this.findOneById(id) as Promise<User>;
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const foundUser = await this.findOneById(id);
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    const user = await this.findOneByEmailWithPassword(foundUser.email);
    if (!user || !user.password) {
      throw new NotFoundException('User not found or has no password set');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async setPassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.update(id, { refreshToken });
  }

  // Helper for generic updates if strictly needed (e.g. from AuthService for refreshToken)
  async update(
    id: string,
    updateData: { refreshToken?: string | null },
  ): Promise<User> {
    await this.usersRepository.update(id, updateData);
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async softDelete(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async remove(id: string): Promise<void> {
    // Get user to delete profile image if exists
    const user = await this.findOneById(id);
    if (user?.profileImage) {
      try {
        await this.storageService.delete(user.profileImage);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Failed to delete profile image during user removal: ${errorMessage}`,
        );
      }
    }
    await this.usersRepository.delete(id);
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<User> {
    return this.usersRepository.manager.transaction(async (manager) => {
      // Get current user to delete old image
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete old profile image if exists
      if (user.profileImage) {
        try {
          await this.storageService.delete(user.profileImage);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Failed to delete old profile image: ${errorMessage}`,
          );
        }
      }

      // Upload new image
      const uploadResult = await this.storageService.upload(
        file,
        storageConfig.folders.profileImages,
      );

      // Update user with new image URL
      await manager.update(User, userId, {
        profileImage: uploadResult.url,
      });

      return manager.findOne(User, { where: { id: userId } }) as Promise<User>;
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    return bcrypt.hash(password, Number(saltRounds));
  }
}
