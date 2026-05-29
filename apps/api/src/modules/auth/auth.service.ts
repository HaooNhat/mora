import { UserService } from '@mora/api/services/user/user.service';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';

import { MetricsService } from '@mora/api/modules/metrics/metrics.service';
import { LoginWithPasswordDto } from './dto/request-dto/login.dto';
import { RegisterDto } from './dto/request-dto/register.dto';

import type { Tokens } from './interfaces/jwt.types';
import type { GoogleLoginInput } from './interfaces/user.google.type';

import { EmailVerificationService } from './services/email-verification.service';
import { JwtTokenService } from './services/jwt-token.service';
import { RefreshTokenRotationService } from './services/refresh-token-rotation.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly refreshTokenRotationService: RefreshTokenRotationService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly metrics: MetricsService,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    const normalizedEmail = dto.email.toLowerCase();
    const existing = await this.userService.getUserByEmail(normalizedEmail);

    if (existing) {
      if (!existing.isActive) {
        throw new UnauthorizedException('This account has been disabled.');
      }

      if (existing.googleId) {
        throw new ConflictException(
          'This email is linked to a Google account. Please sign in with Google.',
        );
      }

      if (!existing.isEmailVerified) {
        await this.emailVerificationService.createAndSendVerificationToken(
          existing.id,
          existing.email,
        );
        throw new ConflictException(
          'This email is already registered but not verified. A new verification email has been sent.',
        );
      }

      throw new ConflictException('An account with this email already exists.');
    }

    const user = await this.userService.createUser({
      email: normalizedEmail,
      email_verified: false,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.emailVerificationService.createAndSendVerificationToken(
      user.id,
      user.email,
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.emailVerificationService.verifyToken(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }

  async getUserProfile(userId: string): Promise<User | null> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User does not exist!');
    }
    return user;
  }

  async loginWithPassword(dto: LoginWithPasswordDto) {
    const user = await this.userService.getUserByEmail(dto.email);

    if (!user || !(await this.userService.verifyPassword(user, dto.password))) {
      this.logger.warn(`Failed login attempt for email: ${dto.email}`);
      this.metrics.authAttemptsTotal.inc({
        method: 'password',
        outcome: 'failure',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      this.metrics.authAttemptsTotal.inc({
        method: 'password',
        outcome: 'unverified',
      });
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (!user.isActive) {
      this.metrics.authAttemptsTotal.inc({
        method: 'password',
        outcome: 'disabled',
      });
      throw new UnauthorizedException('Account is disabled');
    }

    this.metrics.authAttemptsTotal.inc({
      method: 'password',
      outcome: 'success',
    });
    return this.issueAndPersistTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    return this.refreshTokenRotationService.rotateRefreshToken(refreshToken);
  }

  async loginWithGoogle(input: GoogleLoginInput) {
    if (!input.emailVerified) {
      throw new UnauthorizedException(
        'Google account email is not verified. Please verify your email with Google first.',
      );
    }

    let user = await this.userService.getUserByEmail(input.email);

    if (!user) {
      user = await this.userService.createUser({
        email: input.email,
        email_verified: input.emailVerified,
        firstName: input.firstName,
        lastName: input.lastName,
        picture: input.picture,
        googleId: input.googleId,
      });
    } else if (!user.googleId) {
      throw new UnauthorizedException(
        'An account with this email already exists. Please sign in with your password.',
      );
    }

    if (!user.isActive) {
      this.metrics.authAttemptsTotal.inc({
        method: 'google',
        outcome: 'disabled',
      });
      throw new UnauthorizedException('Account is disabled');
    }

    this.metrics.authAttemptsTotal.inc({
      method: 'google',
      outcome: 'success',
    });
    return this.issueAndPersistTokens(user, {
      stableDeviceId: input.stableDeviceId,
    });
  }

  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    await this.refreshTokenRotationService.revokeRefreshToken(refreshToken);
    if (accessToken) {
      await this.jwtTokenService.denyAccessToken(accessToken);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenRotationService.revokeAllDevices(userId);
  }

  private async issueAndPersistTokens(
    user: User,
    options?: { stableDeviceId?: string },
  ): Promise<Tokens> {
    const tokens = this.jwtTokenService.signTokens({
      sub: user.id,
      email: user.email,
    });

    await Promise.all([
      this.refreshTokenRotationService.persistRefreshToken({
        userId: user.id,
        rawRefreshToken: tokens.refreshToken,
        stableDeviceId: options?.stableDeviceId,
      }),
      this.userService.updateLastLogin(user.id),
    ]);

    return tokens;
  }
}
