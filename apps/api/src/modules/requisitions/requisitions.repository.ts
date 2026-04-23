import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PurchaseRequisition,
  PurchaseRequisitionItem,
} from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';

export type RequisitionWithItems = PurchaseRequisition & {
  items: PurchaseRequisitionItem[];
};

@Injectable()
export class RequisitionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.PurchaseRequisitionUncheckedCreateInput,
  ): Promise<RequisitionWithItems> {
    return this.prisma.purchaseRequisition.create({
      data,
      include: { items: true },
    });
  }

  async findMany(
    orgId: string,
    page: number,
    limit: number,
  ): Promise<{ data: RequisitionWithItems[]; total: number }> {
    const where = { organizationId: orgId };
    const [data, total] = await Promise.all([
      this.prisma.purchaseRequisition.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseRequisition.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(
    id: string,
    orgId: string,
  ): Promise<RequisitionWithItems | null> {
    return this.prisma.purchaseRequisition.findFirst({
      where: { id, organizationId: orgId },
      include: { items: true },
    });
  }

  async update(
    id: string,
    data: Prisma.PurchaseRequisitionUncheckedUpdateInput,
  ): Promise<RequisitionWithItems> {
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.purchaseRequisition.delete({ where: { id } });
  }
}
