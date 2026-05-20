import appConfig from '@mora/api/configs/app.config';
import { JobMessage } from '@mora/api/jobs/job.types';
import { RedisService } from '@mora/api/services/redis/redis.service';
import { SqsProducerService } from '@mora/api/services/sqs/sqs-producer.service';
import { UserRepository } from '@mora/api/services/user/user.repository';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import crypto from 'crypto';

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
    private readonly sqsProducer: SqsProducerService,
    @Inject(appConfig.KEY)
    private readonly appConf: ConfigType<typeof appConfig>,
  ) {}

  async createAndSendVerificationToken(
    userId: string,
    email: string,
  ): Promise<void> {
    const previousTokenKey = `email-verify:user:${userId}`;
    const previousToken = await this.redisService.get(previousTokenKey);

    if (previousToken) {
      await this.redisService.del(`email-verify:token:${previousToken}`);
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.redisService.set(
      `email-verify:token:${token}`,
      userId,
      TOKEN_TTL_SECONDS,
    );
    await this.redisService.set(previousTokenKey, token, TOKEN_TTL_SECONDS);

    const verifyUrl = `${this.appConf.backendUrl}/auth/verify-email?token=${token}`;

    const job: JobMessage = {
      type: 'SEND_VERIFICATION_EMAIL',
      payload: { email, verifyUrl },
    };
    await this.sqsProducer.publish(job);
  }

  async verifyToken(token: string): Promise<string | null> {
    const userId = await this.redisService.get(`email-verify:token:${token}`);
    if (!userId) return null;

    await this.redisService.del(`email-verify:token:${token}`);
    await this.redisService.del(`email-verify:user:${userId}`);

    await this.userRepository.update(userId, { isEmailVerified: true });

    return userId;
  }
}
