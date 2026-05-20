import { sqsConfig } from '@mora/env';
import { JobMessage } from '@mora/api/jobs/job.types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsProducerService {
  private readonly logger = new Logger(SqsProducerService.name);
  private readonly client: SQSClient;

  constructor(
    @Inject(sqsConfig.KEY)
    private readonly config: ConfigType<typeof sqsConfig>,
  ) {
    this.client = new SQSClient({
      region: config.region,
      ...(config.endpointUrl ? { endpoint: config.endpointUrl } : {}),
    });
  }

  async publish(message: JobMessage): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.config.queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );
    this.logger.log(`Published job: ${message.type}`);
  }
}
