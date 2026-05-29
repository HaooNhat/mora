import { MailService } from '@mora/worker/services/mail/mail.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SendEmailHandler {
  constructor(private readonly mailService: MailService) {}

  async handle(payload: { email: string; verifyUrl: string }): Promise<void> {
    await this.mailService.sendVerificationEmail(
      payload.email,
      payload.verifyUrl,
    );
  }
}
