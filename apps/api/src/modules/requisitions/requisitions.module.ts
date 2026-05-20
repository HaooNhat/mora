import { TransitionExecutorModule } from '@mora/api/common/transition-executor/transition-executor.module';
import { PrismaModule } from '@mora/api/services/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { RequisitionsController } from './requisitions.controller';
import { RequisitionsRepository } from './requisitions.repository';
import { RequisitionsService } from './requisitions.service';

@Module({
  imports: [PrismaModule, OrganizationModule, TransitionExecutorModule],
  controllers: [RequisitionsController],
  providers: [RequisitionsRepository, RequisitionsService],
  exports: [RequisitionsService],
})
export class RequisitionsModule {}
