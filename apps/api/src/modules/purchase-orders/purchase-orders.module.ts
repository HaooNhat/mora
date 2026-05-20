import { PrismaModule } from '@mora/api/services/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { RequisitionsModule } from '../requisitions/requisitions.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [PrismaModule, OrganizationModule, RequisitionsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersRepository, PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
