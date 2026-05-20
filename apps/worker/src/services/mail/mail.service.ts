import appConfig from '@mora/worker/configs/app.config';
import { mailConfig } from '@mora/env';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,

    @Inject(appConfig.KEY)
    private readonly appConf: ConfigType<typeof appConfig>,
  ) {
    this.resend = new Resend(config.apiKey);
  }

  async sendVerificationEmail(
    toEmail: string,
    verifyUrl: string,
  ): Promise<void> {
    const from = this.config.fromEmail;
    const to =
      this.appConf.nodeEnv === 'production'
        ? toEmail
        : (this.config.devToEmail ?? toEmail);

    const { error } = await this.resend.emails.send({
      from,
      to,
      subject: `Verify your ${this.config.appName} account`,
      html: `
        <p>Thanks for signing up for ${this.config.appName}!</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      this.logger.error(
        `Failed to send verification email to ${to} from ${from}`,
        error,
      );
      throw new Error('Failed to send verification email');
    }
  }
}
