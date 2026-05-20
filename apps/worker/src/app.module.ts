import { databasePrismaConfig, mailConfig, sqsConfig } from '@mora/env';
import appConfig from '@mora/worker/configs/app.config';
import { validate } from '@mora/worker/configs/validation';
import { SqsConsumerService } from '@mora/worker/consumers/sqs.consumer';
import { CleanupTokensHandler } from '@mora/worker/handlers/cleanup-tokens.handler';
import { SendEmailHandler } from '@mora/worker/handlers/send-email.handler';
import { MailModule } from '@mora/worker/services/mail/mail.module';
import { PrismaModule } from '@mora/worker/services/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mailConfig, databasePrismaConfig, sqsConfig],
      validate,
      cache: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
  ],
  providers: [SqsConsumerService, SendEmailHandler, CleanupTokensHandler],
})
export class AppModule {}
