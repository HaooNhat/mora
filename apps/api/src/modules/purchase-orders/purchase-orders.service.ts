import { paginate, Paginated } from '@mora/api/common/dto/page-query.dto';
import {
  ForbiddenTransitionException,
  InvalidTransitionException,
  MissingRequiredFieldException,
} from '@mora/api/common/state-machine/exceptions';
import { applyTransition } from '@mora/api/common/state-machine/state-machine';
import { Actor } from '@mora/api/common/state-machine/types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus, RequisitionStatus } from '@prisma/client';
import { RequisitionsService } from '../requisitions/requisitions.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { canCreateOrder } from './purchase-orders.policy';
import {
  PurchaseOrdersRepository,
  PurchaseOrderWithItems,
} from './purchase-orders.repository';
import {
  PURCHASE_ORDER_TRANSITIONS,
  PurchaseOrderEvent,
} from './purchase-orders.transitions';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly purchaseOrdersRepository: PurchaseOrdersRepository,
    private readonly requisitionsService: RequisitionsService,
  ) {}

  async create(
    dto: CreatePurchaseOrderDto,
    actor: Actor,
  ): Promise<PurchaseOrderWithItems> {
    if (!canCreateOrder(actor.role)) {
      throw new ForbiddenException(
        'Only buyers and procurement managers can create purchase orders.',
      );
    }

    // Validate the referenced PR exists and is approved
    const pr = await this.requisitionsService.findOne(
      dto.requisitionId,
      dto.buyerOrgId,
    );
    if (pr.status !== RequisitionStatus.APPROVED) {
      throw new BadRequestException(
        `Requisition must be in APPROVED status to create a PO. Current status: ${pr.status}.`,
      );
    }

    const currency = dto.currency ?? pr.currency;
    const shippingAmount = dto.shippingAmount ?? 0;
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const totalAmount = subtotal + shippingAmount;

    const po = await this.purchaseOrdersRepository.create({
      requisitionId: dto.requisitionId,
      buyerOrgId: dto.buyerOrgId,
      supplierOrgId: dto.supplierOrgId,
      status: PurchaseOrderStatus.SUBMITTED,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      subtotal,
      shippingAmount,
      totalAmount,
      currency,
      createdBy: actor.id,
      notes: dto.notes,
      items: {
        create: dto.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          currency,
        })),
      },
    });

    // Mark the PR as ordered — this is atomic from the domain perspective:
    // a PR can only be ordered once, and a PO creation is the trigger.
    await this.requisitionsService.markOrdered(dto.requisitionId, actor);

    return po;
  }

  async findAll(
    orgId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<PurchaseOrderWithItems>> {
    const { data, total } = await this.purchaseOrdersRepository.findMany(
      orgId,
      page,
      limit,
    );
    return paginate(data, total, page, limit);
  }

  async findOne(id: string, orgId: string): Promise<PurchaseOrderWithItems> {
    const po = await this.purchaseOrdersRepository.findOne(id, orgId);
    if (!po || (po.buyerOrgId !== orgId && po.supplierOrgId !== orgId)) {
      throw new NotFoundException(`Purchase order ${id} not found.`);
    }
    return po;
  }

  // ---------------------------------------------------------------------------
  // Manual transitions (HTTP endpoints)
  // ---------------------------------------------------------------------------

  async send(id: string, actor: Actor): Promise<PurchaseOrderWithItems> {
    const po = await this.findOne(id, actor.orgId);
    const newStatus = this.transition(po, 'SEND', actor);

    return this.purchaseOrdersRepository.updateStatus(id, newStatus);
  }

  async confirm(id: string, actor: Actor): Promise<PurchaseOrderWithItems> {
    // findOne checks actor.orgId is buyer or supplier — prevents probing for PO existence
    const po = await this.findOne(id, actor.orgId);

    const newStatus = this.transition(po, 'CONFIRM', actor);

    return this.purchaseOrdersRepository.updateStatus(id, newStatus, {
      approvedBy: actor.id,
      approvedAt: new Date(),
    });
  }

  async cancel(id: string, actor: Actor): Promise<PurchaseOrderWithItems> {
    const po = await this.findOne(id, actor.orgId);
    const newStatus = this.transition(po, 'CANCEL', actor);

    return this.purchaseOrdersRepository.updateStatus(id, newStatus);
  }

  // ---------------------------------------------------------------------------
  // System-triggered transitions (called from other modules, not HTTP endpoints)
  // ---------------------------------------------------------------------------

  /**
   * Recalculates PO status after a GoodsReceipt is saved.
   * Called by the GoodsReceiptsService — not exposed via HTTP.
   *
   * Logic:
   *   totalReceived == 0              → stay CONFIRMED (no change)
   *   0 < totalReceived < totalOrdered → PARTIALLY_RECEIVED
   *   totalReceived >= totalOrdered   → RECEIVED
   */
  async recalculateReceiptStatus(
    orderId: string,
  ): Promise<PurchaseOrderWithItems> {
    const po = await this.purchaseOrdersRepository.findById(orderId);
    if (!po)
      throw new NotFoundException(`Purchase order ${orderId} not found.`);

    const allowedStatuses: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.CONFIRMED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ];
    if (!allowedStatuses.includes(po.status)) {
      throw new BadRequestException(
        `Cannot update receipt status for a PO in ${po.status} state.`,
      );
    }

    const { totalOrdered, totalReceived } =
      await this.purchaseOrdersRepository.sumReceivedQuantity(orderId);

    if (totalReceived <= 0) {
      return po; // No goods received yet — status unchanged
    }

    const newStatus =
      totalReceived >= totalOrdered
        ? PurchaseOrderStatus.RECEIVED
        : PurchaseOrderStatus.PARTIALLY_RECEIVED;

    if (newStatus === po.status) {
      return po; // Already correct — skip the write
    }

    return this.purchaseOrdersRepository.updateStatus(orderId, newStatus);
  }

  /**
   * Moves PO to INVOICED when an invoice is submitted against it.
   * Called by the InvoicesService — not exposed via HTTP.
   */
  async markInvoiced(orderId: string): Promise<PurchaseOrderWithItems> {
    const po = await this.purchaseOrdersRepository.findById(orderId);
    if (!po)
      throw new NotFoundException(`Purchase order ${orderId} not found.`);

    if (po.status !== PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException(
        `A PO must be fully RECEIVED before it can be invoiced. Current status: ${po.status}.`,
      );
    }

    return this.purchaseOrdersRepository.updateStatus(
      orderId,
      PurchaseOrderStatus.INVOICED,
    );
  }

  /**
   * Closes the PO when its invoice is fully paid.
   * Called by the PaymentsService — not exposed via HTTP.
   */
  async markClosed(orderId: string): Promise<PurchaseOrderWithItems> {
    const po = await this.purchaseOrdersRepository.findById(orderId);
    if (!po)
      throw new NotFoundException(`Purchase order ${orderId} not found.`);

    if (po.status !== PurchaseOrderStatus.INVOICED) {
      throw new BadRequestException(
        `A PO must be INVOICED before it can be closed. Current status: ${po.status}.`,
      );
    }

    return this.purchaseOrdersRepository.updateStatus(
      orderId,
      PurchaseOrderStatus.CLOSED,
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private transition(
    po: PurchaseOrderWithItems,
    event: PurchaseOrderEvent,
    actor: Actor,
  ): PurchaseOrderStatus {
    try {
      return applyTransition(PURCHASE_ORDER_TRANSITIONS, po, event, {
        doc: po,
        actor,
      });
    } catch (err) {
      if (err instanceof InvalidTransitionException) {
        throw new BadRequestException(err.message);
      }
      if (err instanceof ForbiddenTransitionException) {
        throw new ForbiddenException(err.message);
      }
      if (err instanceof MissingRequiredFieldException) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}
