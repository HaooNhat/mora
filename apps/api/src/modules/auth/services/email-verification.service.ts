import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { MailService } from 'src/services/mail/mail.service';
import { RedisService } from 'src/services/redis/redis.service';
import { UserRepository } from 'src/services/user/user.repository';

const TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours — Redis TTL replaces cron cleanup

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async createAndSendVerificationToken(
    userId: string,
    email: string,
  ): Promise<void> {
    // Invalidate any previous token for this user
    const previousTokenKey = `email-verify:user:${userId}`;
    const previousToken = await this.redisService.get(previousTokenKey);
    if (previousToken) {
      await this.redisService.del(`email-verify:token:${previousToken}`);
    }

    const token = crypto.randomBytes(32).toString('hex');

    // token → userId (looked up on verification)
    await this.redisService.set(`email-verify:token:${token}`, userId, TOKEN_TTL_SECONDS);
    // userId → token (used to invalidate previous token on re-registration)
    await this.redisService.set(previousTokenKey, token, TOKEN_TTL_SECONDS);

    const verifyUrl = `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/auth/verify-email?token=${token}`;
    await this.mailService.sendVerificationEmail(email, verifyUrl);
  }

  async verifyToken(token: string): Promise<string | null> {
    const userId = await this.redisService.get(`email-verify:token:${token}`);
    if (!userId) return null;

    // Delete both keys atomically-enough (single-use token)
    await this.redisService.del(`email-verify:token:${token}`);
    await this.redisService.del(`email-verify:user:${userId}`);

    await this.userRepository.update(userId, { isEmailVerified: true });

    return userId;
  }
}
