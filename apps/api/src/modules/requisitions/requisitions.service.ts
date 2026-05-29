import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequisitionStatus } from '@prisma/client';

import { paginate, Paginated } from '@mora/api/common/dto/page-query.dto';
import { Actor } from '@mora/api/common/state-machine/types';
import { TransitionExecutor } from '@mora/api/common/transition-executor/transition-executor.service';
import { RedisService } from '@mora/api/services/redis/redis.service';

import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { UpdateRequisitionDto } from './dto/update-requisition.dto';
import {
  RequisitionsRepository,
  RequisitionWithItems,
} from './requisitions.repository';
import { REQUISITION_TRANSITIONS } from './requisitions.transitions';

const REQUISITION_CACHE_TTL = 300; // 5 minutes

@Injectable()
export class RequisitionsService {
  constructor(
    private readonly requisitionsRepository: RequisitionsRepository,
    private readonly redisService: RedisService,
    private readonly transitionExecutor: TransitionExecutor,
  ) {}

  async create(
    dto: CreateRequisitionDto,
    actor: Actor,
  ): Promise<RequisitionWithItems> {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const result = await this.requisitionsRepository.create({
      title: dto.title,
      description: dto.description,
      organizationId: dto.orgId,
      requestedBy: actor.id,
      totalAmount,
      currency: dto.currency ?? 'USD',
      status: RequisitionStatus.SUBMITTED,
      items: {
        create: dto.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          currency: dto.currency ?? 'USD',
          notes: item.notes,
        })),
      },
    });
    await this.invalidateOrgCache(dto.orgId);
    return result;
  }

  async findAll(
    orgId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<RequisitionWithItems>> {
    const cacheKey = `requisitions:${orgId}:${page}:${limit}`;
    const cached = await this.redisService.getObject<{
      data: RequisitionWithItems[];
      total: number;
    }>(cacheKey);

    if (cached) return paginate(cached.data, cached.total, page, limit);

    const { data, total } = await this.requisitionsRepository.findMany(
      orgId,
      page,
      limit,
    );

    await this.redisService.setObject(
      cacheKey,
      { data, total },
      REQUISITION_CACHE_TTL,
    );

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, orgId: string): Promise<RequisitionWithItems> {
    const pr = await this.requisitionsRepository.findOne(id, orgId);
    if (!pr) throw new NotFoundException(`Requisition ${id} not found.`);
    return pr;
  }

  async update(
    id: string,
    dto: UpdateRequisitionDto,
    actor: Actor,
  ): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);

    if (pr.status !== RequisitionStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only SUBMITTED requisitions can be updated.',
      );
    }
    if (pr.requestedBy !== actor.id) {
      throw new ForbiddenException(
        'Only the requester can edit this requisition.',
      );
    }

    const totalAmount = dto.items
      ? dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : Number(pr.totalAmount);

    const result = await this.requisitionsRepository.update(id, actor.orgId, {
      title: dto.title,
      description: dto.description,
      totalAmount,
      ...(dto.items && {
        items: {
          deleteMany: {},
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            currency: pr.currency,
            notes: item.notes,
          })),
        },
      }),
    });
    await this.invalidateOrgCache(actor.orgId);
    return result;
  }

  async remove(id: string, actor: Actor): Promise<void> {
    const pr = await this.findOne(id, actor.orgId);

    if (pr.status !== RequisitionStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only SUBMITTED requisitions can be deleted.',
      );
    }
    if (pr.requestedBy !== actor.id) {
      throw new ForbiddenException(
        'Only the requester can delete this requisition.',
      );
    }

    await this.requisitionsRepository.delete(id, actor.orgId);
    await this.invalidateOrgCache(actor.orgId);
  }

  // ---------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------

  async approve(id: string, actor: Actor): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);

    const result = await this.transitionExecutor.execute(
      {
        map: REQUISITION_TRANSITIONS,
        doc: pr,
        event: 'APPROVE',
        ctx: { doc: pr, actor },
        orgId: actor.orgId,
        entityType: 'REQUISITION',
      },
      (tx, newStatus) =>
        tx.purchaseRequisition.update({
          where: { id, organizationId: actor.orgId },
          data: {
            status: newStatus,
            approvedBy: actor.id,
            approvedAt: new Date(),
          },
          include: { items: true },
        }),
    );

    await this.invalidateOrgCache(actor.orgId);
    return result as RequisitionWithItems;
  }

  async reject(
    id: string,
    rejectedReason: string,
    actor: Actor,
  ): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);

    const result = await this.transitionExecutor.execute(
      {
        map: REQUISITION_TRANSITIONS,
        doc: pr,
        event: 'REJECT',
        ctx: { doc: pr, actor, payload: { rejectedReason } },
        orgId: actor.orgId,
        entityType: 'REQUISITION',
        metadata: { rejectedReason },
      },
      (tx, newStatus) =>
        tx.purchaseRequisition.update({
          where: { id, organizationId: actor.orgId },
          data: {
            status: newStatus,
            approvedBy: actor.id,
            approvedAt: new Date(),
            rejectedReason,
          },
          include: { items: true },
        }),
    );

    await this.invalidateOrgCache(actor.orgId);
    return result as RequisitionWithItems;
  }

  /**
   * Called internally by the PurchaseOrdersService when a PO is created
   * from this PR. Not exposed as a public HTTP endpoint.
   */
  async markOrdered(id: string, actor: Actor): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);

    const newStatus = this.transitionExecutor.validate({
      map: REQUISITION_TRANSITIONS,
      doc: pr,
      event: 'ORDER',
      ctx: { doc: pr, actor },
    });

    const result = await this.transitionExecutor.executeWithAudit(
      {
        orgId: actor.orgId,
        entityType: 'REQUISITION',
        entityId: id,
        event: 'ORDER',
        fromStatus: pr.status,
        toStatus: newStatus,
        actorId: actor.id,
      },
      (tx) =>
        tx.purchaseRequisition.update({
          where: { id, organizationId: actor.orgId },
          data: { status: newStatus },
          include: { items: true },
        }),
    );

    await this.invalidateOrgCache(actor.orgId);
    return result as RequisitionWithItems;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async invalidateOrgCache(orgId: string): Promise<void> {
    await this.redisService.delByPattern(`requisitions:${orgId}:*`);
  }
}
