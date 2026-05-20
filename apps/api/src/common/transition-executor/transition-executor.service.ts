import {
  ForbiddenTransitionException,
  InvalidTransitionException,
  MissingRequiredFieldException,
} from '@mora/api/common/state-machine/exceptions';
import { applyTransition } from '@mora/api/common/state-machine/state-machine';
import {
  TransitionContext,
  TransitionMap,
} from '@mora/api/common/state-machine/types';
import { PrismaService } from '@mora/api/services/prisma/prisma.service';
import { MetricsService } from '@mora/api/modules/metrics/metrics.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type AuditEntityType =
  | 'REQUISITION'
  | 'PURCHASE_ORDER'
  | 'INVOICE'
  | 'PAYMENT';

// ---------------------------------------------------------------------------
// Optimistic lock type
//
// A function the CALLER provides that atomically checks the row still has the
// expected fromStatus and sets it to newStatus.  Returning { count: 0 } means
// another request already transitioned the row — the executor throws 409.
//
// The executor passes newStatus as the second argument so the caller doesn't
// have to know it in advance (it is only computed after validate() runs).
//
// Usage pattern:
//   lock: (tx, newStatus) =>
//     tx.someModel.updateMany({
//       where: { id, status: currentDoc.status },  // ← fromStatus guard
//       data:  { status: newStatus },               // ← atomic flip
//     })
//
// When lock is provided, your dbUpdate callback MUST NOT set status again —
// the lock already did it.  Only set the remaining fields (approvedBy, etc.).
// ---------------------------------------------------------------------------
export type LockFn<TStatus extends string = string> = (
  tx: Prisma.TransactionClient,
  newStatus: TStatus,
) => Promise<{ count: number }>;

export interface ExecuteParams<
  TStatus extends string,
  TEvent extends string,
  TDoc extends { id: string; status: TStatus },
> {
  map: TransitionMap<TStatus, TEvent, TDoc>;
  doc: TDoc;
  event: TEvent;
  ctx: TransitionContext<TDoc>;
  orgId: string;
  entityType: AuditEntityType;
  /** Extra payload written to the audit log (e.g. rejectedReason). */
  metadata?: Record<string, unknown>;
  /**
   * Optional optimistic lock.  When supplied, the executor runs the lock
   * inside the transaction before dbUpdate.  If the lock returns count=0
   * a ConflictException is thrown.  See LockFn documentation above.
   */
  lock?: LockFn<TStatus>;
}

/**
 * Applies a state-machine transition atomically:
 *   1. Validates the transition (pure, synchronous guard).
 *   2. (Optional) Runs the caller-supplied lock — throws 409 on concurrent write.
 *   3. Runs the caller-supplied DB update inside a Prisma transaction.
 *   4. Writes an AuditLog row in the same transaction.
 *
 * The AuditLog row also acts as the event outbox: publishedAt IS NULL until
 * a background poller picks it up and publishes it to the event bus.
 */
@Injectable()
export class TransitionExecutor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async execute<
    TStatus extends string,
    TEvent extends string,
    TDoc extends { id: string; status: TStatus },
    TResult,
  >(
    params: ExecuteParams<TStatus, TEvent, TDoc>,
    dbUpdate: (
      tx: Prisma.TransactionClient,
      newStatus: TStatus,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    const newStatus = this.validate(params);

    const result = await this.prisma.$transaction(async (tx) => {
      if (params.lock) {
        const { count } = await params.lock(tx, newStatus);
        if (count === 0) {
          throw new ConflictException(
            `${params.entityType} ${params.doc.id} was modified concurrently. Please retry.`,
          );
        }
      }

      const txResult = await dbUpdate(tx, newStatus);

      await tx.auditLog.create({
        data: {
          organizationId: params.orgId,
          entityType: params.entityType,
          entityId: params.doc.id,
          event: params.event,
          fromStatus: params.doc.status,
          toStatus: newStatus,
          actorId: params.ctx.actor.id,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return txResult;
    });

    if (params.entityType === 'REQUISITION') {
      this.metrics.requisitionTransitionsTotal.inc({
        from_state: params.doc.status,
        to_state: newStatus,
        outcome: 'success',
      });
    }

    return result;
  }

  /**
   * Runs a DB update inside a transaction and writes an audit log entry.
   * Use when the target status differs from the state-machine definition
   * (e.g. auto-approval that skips SUBMITTED, or internal ORDER event).
   */
  async executeWithAudit<TResult>(
    audit: {
      orgId: string;
      entityType: AuditEntityType;
      entityId: string;
      event: string;
      fromStatus: string;
      toStatus: string;
      actorId: string;
      metadata?: Record<string, unknown>;
      /**
       * Optional optimistic lock.  fromStatus and toStatus are already in
       * scope from the audit params — use them directly in the lock body.
       * See LockFn documentation above.
       */
      lock?: LockFn;
    },
    dbUpdate: (tx: Prisma.TransactionClient) => Promise<TResult>,
  ): Promise<TResult> {
    return this.prisma.$transaction(async (tx) => {
      if (audit.lock) {
        const { count } = await audit.lock(tx, audit.toStatus);
        if (count === 0) {
          throw new ConflictException(
            `${audit.entityType} ${audit.entityId} was modified concurrently. Please retry.`,
          );
        }
      }

      const result = await dbUpdate(tx);

      await tx.auditLog.create({
        data: {
          organizationId: audit.orgId,
          entityType: audit.entityType,
          entityId: audit.entityId,
          event: audit.event,
          fromStatus: audit.fromStatus,
          toStatus: audit.toStatus,
          actorId: audit.actorId,
          metadata: (audit.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return result;
    });
  }

  /**
   * Validates the transition and maps state-machine exceptions to NestJS HTTP
   * exceptions.  Kept separate so callers can validate without executing.
   */
  validate<
    TStatus extends string,
    TEvent extends string,
    TDoc extends { id: string; status: TStatus },
  >(
    params: Pick<
      ExecuteParams<TStatus, TEvent, TDoc>,
      'map' | 'doc' | 'event' | 'ctx'
    >,
  ): TStatus {
    try {
      return applyTransition(params.map, params.doc, params.event, params.ctx);
    } catch (err) {
      if (err instanceof InvalidTransitionException)
        throw new BadRequestException(err.message);
      if (err instanceof ForbiddenTransitionException)
        throw new ForbiddenException(err.message);
      if (err instanceof MissingRequiredFieldException)
        throw new BadRequestException(err.message);
      throw err;
    }
  }
}
