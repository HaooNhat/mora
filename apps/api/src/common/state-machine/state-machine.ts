import {
  ForbiddenTransitionException,
  InvalidTransitionException,
  MissingRequiredFieldException,
} from './exceptions';
import { TransitionContext, TransitionMap } from './types';

/**
 * Applies a transition event to a document and returns the new status.
 *
 * This is a pure function — it reads the transition map, validates guards
 * and required fields, and returns the target status. It does NOT save
 * anything to the database or emit events. That is the caller's responsibility.
 *
 * Throws:
 *   InvalidTransitionException    — event not allowed from current status
 *   ForbiddenTransitionException  — guard returned false
 *   MissingRequiredFieldException — a required payload field is absent
 *
 * @example
 *   const newStatus = applyTransition(
 *     REQUISITION_TRANSITIONS,
 *     requisition,
 *     'APPROVE',
 *     { doc: requisition, actor, payload: {} },
 *   );
 *   await prisma.purchaseRequisition.update({ where: { id }, data: { status: newStatus } });
 */
export function applyTransition<
  TStatus extends string,
  TEvent extends string,
  TDoc extends { status: TStatus },
>(
  map: TransitionMap<TStatus, TEvent, TDoc>,
  doc: TDoc,
  event: TEvent,
  ctx: TransitionContext<TDoc>,
): TStatus {
  const fromTransitions = map[doc.status];
  const transition = fromTransitions?.[event];

  if (!transition) {
    throw new InvalidTransitionException(doc.status, event);
  }

  if (transition.requires) {
    for (const field of transition.requires) {
      const value = ctx.payload?.[field];
      if (value === undefined || value === null || value === '') {
        throw new MissingRequiredFieldException(field);
      }
    }
  }

  if (transition.guard && !transition.guard(ctx)) {
    throw new ForbiddenTransitionException(doc.status, event);
  }

  return transition.to;
}
