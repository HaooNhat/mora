import { PrismaService } from '@mora/api/services/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from '@prisma/client';

export type PurchaseOrderWithItems = PurchaseOrder & {
  items: PurchaseOrderItem[];
};

@Injectable()
export class PurchaseOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.PurchaseOrderUncheckedCreateInput,
  ): Promise<PurchaseOrderWithItems> {
    return this.prisma.purchaseOrder.create({
      data,
      include: { items: true },
    });
  }

  /**
   * Lists POs where the given org is either the buyer OR the supplier,
   * so both parties can see the orders they are involved in.
   */
  async findMany(
    orgId: string,
    page: number,
    limit: number,
  ): Promise<{ data: PurchaseOrderWithItems[]; total: number }> {
    const where = { OR: [{ buyerOrgId: orgId }, { supplierOrgId: orgId }] };
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { items: true },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total };
  }

  /** Finds by ID with no org restriction — for system-triggered operations. */
  async findById(id: string): Promise<PurchaseOrderWithItems | null> {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  /** Finds by ID and verifies the org is the buyer or supplier. */
  async findOne(
    id: string,
    orgId: string,
  ): Promise<PurchaseOrderWithItems | null> {
    const po = await this.findById(id);
    if (!po || (po.buyerOrgId !== orgId && po.supplierOrgId !== orgId)) {
      return null;
    }
    return po;
  }

  async update(
    id: string,
    data: Prisma.PurchaseOrderUncheckedUpdateInput,
  ): Promise<PurchaseOrderWithItems> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  /**
   * Aggregates total quantity received across all GoodsReceipts for this PO.
   * Used by recalculateReceiptStatus to decide the new PO status.
   */
  async sumReceivedQuantity(orderId: string): Promise<{
    totalOrdered: number;
    totalReceived: number;
  }> {
    const [orderedAgg, receivedAgg] = await Promise.all([
      this.prisma.purchaseOrderItem.aggregate({
        where: { orderId },
        _sum: { quantity: true },
      }),
      this.prisma.goodsReceiptItem.aggregate({
        where: { orderItem: { orderId } },
        _sum: { quantityReceived: true },
      }),
    ]);

    return {
      totalOrdered: Number(orderedAgg._sum.quantity ?? 0),
      totalReceived: Number(receivedAgg._sum.quantityReceived ?? 0),
    };
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    extra?: Prisma.PurchaseOrderUncheckedUpdateInput,
  ): Promise<PurchaseOrderWithItems> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status, ...extra },
      include: { items: true },
    });
  }
}
