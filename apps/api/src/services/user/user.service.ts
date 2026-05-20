import userConfig from '@mora/api/configs/user.config';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(userConfig.KEY)
    private readonly userConfiguration: ConfigType<typeof userConfig>,
    private readonly userRepository: UserRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(
        dto.password,
        this.userConfiguration.saltOrRounds,
      );
    }

    return this.userRepository.create({
      email: dto.email,
      passwordHash: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      picture: dto.picture,
      googleId: dto.googleId,
      isEmailVerified: dto.email_verified,
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async verifyPassword(user: User, plaintext: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(plaintext, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }
}
