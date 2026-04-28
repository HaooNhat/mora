import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequisitionStatus } from '@prisma/client';

import { paginate, Paginated } from '@mora/api/common/dto/page-query.dto';
import {
  ForbiddenTransitionException,
  InvalidTransitionException,
  MissingRequiredFieldException,
} from '@mora/api/common/state-machine/exceptions';
import { applyTransition } from '@mora/api/common/state-machine/state-machine';
import { Actor } from '@mora/api/common/state-machine/types';
import { RedisService } from '@mora/api/services/redis/redis.service';

import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { UpdateRequisitionDto } from './dto/update-requisition.dto';
import { isAutoApproved } from './requisitions.policy';
import {
  RequisitionsRepository,
  RequisitionWithItems,
} from './requisitions.repository';
import {
  REQUISITION_TRANSITIONS,
  RequisitionEvent,
} from './requisitions.transitions';

const REQUISITION_CACHE_TTL = 300; // 5 minutes

@Injectable()
export class RequisitionsService {
  constructor(
    private readonly requisitionsRepository: RequisitionsRepository,
    private readonly redisService: RedisService,
  ) {}

  async create(
    dto: CreateRequisitionDto,
    actor: Actor,
  ): Promise<RequisitionWithItems> {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    return this.requisitionsRepository.create({
      title: dto.title,
      description: dto.description,
      organizationId: dto.orgId,
      requestedBy: actor.id,
      totalAmount,
      currency: dto.currency ?? 'USD',
      status: RequisitionStatus.DRAFT,
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
  }

  async findAll(
    orgId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<RequisitionWithItems>> {
    const cacheKey = `requisitions:${orgId}:${page}:${limit}`;
    const cached =
      await this.redisService.getObject<RequisitionWithItems[]>(cacheKey);

    if (cached) return paginate(cached, cached.length, page, limit);

    const { data, total } = await this.requisitionsRepository.findMany(
      orgId,
      page,
      limit,
    );

    const requisitions: RequisitionWithItems[] = data;
    await this.redisService.setObject(
      cacheKey,
      requisitions,
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

    if (pr.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT requisitions can be updated.');
    }
    if (pr.requestedBy !== actor.id) {
      throw new ForbiddenException(
        'Only the requester can edit this requisition.',
      );
    }

    const totalAmount = dto.items
      ? dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : Number(pr.totalAmount);

    return this.requisitionsRepository.update(id, {
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
  }

  async remove(id: string, actor: Actor): Promise<void> {
    const pr = await this.findOne(id, actor.orgId);

    if (pr.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT requisitions can be deleted.');
    }
    if (pr.requestedBy !== actor.id) {
      throw new ForbiddenException(
        'Only the requester can delete this requisition.',
      );
    }

    await this.requisitionsRepository.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------

  async submit(id: string, actor: Actor): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);
    this.transition(pr, 'SUBMIT', actor);

    // Compute the final status before writing — single atomic update, no transaction needed.
    const autoApprove = isAutoApproved(Number(pr.totalAmount));

    return this.requisitionsRepository.update(id, {
      status: autoApprove
        ? RequisitionStatus.APPROVED
        : RequisitionStatus.SUBMITTED,
      ...(autoApprove && { approvedAt: new Date() }),
    });
  }

  async approve(id: string, actor: Actor): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);
    const newStatus = this.transition(pr, 'APPROVE', actor);

    return this.requisitionsRepository.update(id, {
      status: newStatus,
      approvedBy: actor.id,
      approvedAt: new Date(),
    });
  }

  async reject(
    id: string,
    rejectedReason: string,
    actor: Actor,
  ): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);
    const newStatus = this.transition(pr, 'REJECT', actor, { rejectedReason });

    return this.requisitionsRepository.update(id, {
      status: newStatus,
      approvedBy: actor.id,
      approvedAt: new Date(),
      rejectedReason,
    });
  }

  /**
   * Called internally by the PurchaseOrdersService when a PO is created
   * from this PR. Not exposed as a public HTTP endpoint.
   */
  async markOrdered(id: string, actor: Actor): Promise<RequisitionWithItems> {
    const pr = await this.findOne(id, actor.orgId);
    const newStatus = this.transition(pr, 'ORDER', actor);

    return this.requisitionsRepository.update(id, { status: newStatus });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Wraps applyTransition and maps state machine exceptions to NestJS HTTP exceptions.
   */
  private transition(
    pr: RequisitionWithItems,
    event: RequisitionEvent,
    actor: Actor,
    payload?: Record<string, unknown>,
  ): RequisitionStatus {
    try {
      return applyTransition(REQUISITION_TRANSITIONS, pr, event, {
        doc: pr,
        actor,
        payload,
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
