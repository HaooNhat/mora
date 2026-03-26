import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import userConfig from './configs/user.config';
import { CreateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(userConfig.KEY)
    private readonly userConfiguration: ConfigType<typeof userConfig>,
    private readonly prismaService: PrismaService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const userExisted = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (userExisted) {
      throw new ConflictException('User with this email already exist');
    }

    // Hashing password using bcrypt hash salt for secure
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(
        dto.password,
        this.userConfiguration.saltOrRounds,
      );
    }

    return this.prismaService.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        picture: dto.picture,
        googleId: dto.googleId,
        lastLoginAt: new Date(Date.now()),
        isEmailVerified: false,
      },
    });
  }

  // async getUser(): Promise<User> {}

  async getUserByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      return await this.prismaService.user.findUnique({
        where: { email: email },
      });
    } catch (error) {
      console.error('Failed to fetch user by email', error);
      throw new Error('Database query failed');
    }
  }
}
