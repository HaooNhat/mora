import { Global, Module } from '@nestjs/common';
import { SqsProducerService } from './sqs-producer.service';

@Global()
@Module({
  providers: [SqsProducerService],
  exports: [SqsProducerService],
})
export class SqsModule {}
