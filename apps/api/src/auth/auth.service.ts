import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import jwtConfig from './configs/jwt.config';
import { LoginWithPasswordDto } from './dto/login.dto';
import { GoogleLoginInput } from './interfaces/user.google.type';
import { Response } from 'express';
import { Tokens } from './interfaces/jwt.types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prismaService: PrismaService,
    private jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly JwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /** Hash a refresh token using SHA-256 for fast hashing and comparing */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Safe compare due to vulnerable to timing attacks */
  // private safeCompare(a: string, b: string): boolean {
  //   return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  // }

  setAuthCookies(res: Response, tokens: Tokens) {
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  async getUserProfile(email: string): Promise<User | null> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User does not exist!');
    }

    return user;
  }

  async loginWithPassword(dto: LoginWithPasswordDto) {
    const user = await this.userService.getUserByEmail(dto.email);
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      console.error(
        'Failed login attempt on:',
        Date.now(),
        'invalid credentials',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  /** Generate access and refresh tokens for user */
  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.JwtConfiguration.JwtSecret,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.JwtConfiguration.JwtRefreshSecret,
    });

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  /** Save hashed refresh token */
  async saveRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = this.hashToken(refreshToken);

    await this.prismaService.refreshToken.create({
      data: {
        userId: userId,
        hashedToken: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return hashedToken;
  }

  /** Validate incoming refresh token */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let payload: {
      sub: string;
      email: string;
    };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.JwtConfiguration.JwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const hashedIncomingToken = this.hashToken(refreshToken);
    const tokenRecord = await this.prismaService.refreshToken.findFirst({
      where: {
        userId,
        hashedToken: hashedIncomingToken,
        revoked: false,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token does not match!');
    }

    await this.prismaService.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  async loginWithGoogle(input: GoogleLoginInput) {
    let user = await this.userService.getUserByEmail(input.email);
    if (!user) {
      user = await this.userService.createUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        picture: input.picture,
        googleId: input.googleId,
      });
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    console.log('tsetasasdf');
    return { accessToken, refreshToken };
  }

  /**
   * Logout from current refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    let payload: {
      sub: string;
      email: string;
    };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.JwtConfiguration.JwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;

    const hashedToken = this.hashToken(refreshToken);

    await this.prismaService.refreshToken.updateMany({
      where: {
        userId,
        hashedToken,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
  }

  /**
   * Logout from all devices by revoking all refresh tokens for the user
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.prismaService.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}
