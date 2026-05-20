import { sqsConfig } from '@mora/env';
import { SendEmailHandler } from '@mora/worker/handlers/send-email.handler';
import { JobMessage } from '@mora/worker/jobs/job.types';
import { Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

@Injectable()
export class SqsConsumerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly client: SQSClient;
  private running = false;

  constructor(
    @Inject(sqsConfig.KEY)
    private readonly config: ConfigType<typeof sqsConfig>,
    private readonly sendEmail: SendEmailHandler,
  ) {
    this.client = new SQSClient({
      region: config.region,
      ...(config.endpointUrl ? { endpoint: config.endpointUrl } : {}),
    });
  }

  onApplicationBootstrap() {
    this.running = true;
    void this.poll();
    this.logger.log('SQS consumer started');
  }

  onApplicationShutdown() {
    this.running = false;
  }

  private async poll() {
    while (this.running) {
      try {
        const { Messages = [] } = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.config.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
          }),
        );

        await Promise.all(Messages.map((m) => this.process(m)));
      } catch (err) {
        this.logger.error('SQS poll error', err);
        await new Promise((r) => setTimeout(r, 5_000));
      }
    }
  }

  private async process(message: { Body?: string; MessageId?: string; ReceiptHandle?: string }) {
    try {
      const job = JSON.parse(message.Body!) as JobMessage;

      switch (job.type) {
        case 'SEND_VERIFICATION_EMAIL':
          await this.sendEmail.handle(job.payload);
          break;
        default:
          this.logger.warn(`Unknown job type: ${(job as any).type}`);
      }

      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.config.queueUrl,
          ReceiptHandle: message.ReceiptHandle!,
        }),
      );
    } catch (err) {
      this.logger.error(`Job failed (will retry): ${message.MessageId}`, err);
    }
  }
}
