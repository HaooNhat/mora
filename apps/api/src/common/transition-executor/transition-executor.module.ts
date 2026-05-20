import { PrismaModule } from '@mora/api/services/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { TransitionExecutor } from './transition-executor.service';

@Module({
  imports: [PrismaModule],
  providers: [TransitionExecutor],
  exports: [TransitionExecutor],
})
export class TransitionExecutorModule {}
