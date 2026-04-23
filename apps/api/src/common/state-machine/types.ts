import { OrganizationRole } from '@prisma/client';

/**
 * The actor performing the transition — the authenticated user
 * resolved with their role in the relevant organization.
 */
export type Actor = {
  id: string;
  role: OrganizationRole;
  orgId: string;
};

/**
 * Context passed into every guard and required-field check.
 */
export type TransitionContext<TDoc> = {
  doc: TDoc;
  actor: Actor;
  /** Extra fields from the request body (e.g. rejectedReason) */
  payload?: Record<string, unknown>;
};

/**
 * A single transition definition.
 *
 * - `to`       — the target status if transition is allowed
 * - `guard`    — optional fn that returns false to block the transition
 * - `requires` — payload keys that must be present (non-empty) to proceed
 *
 * Effects (emails, cascading updates) are handled in the service layer,
 * not here — keeping this as pure, synchronous, testable data.
 */
export type Transition<TStatus, TDoc> = {
  to: TStatus;
  guard?: (ctx: TransitionContext<TDoc>) => boolean;
  requires?: string[];
};

/**
 * Full transition map for a document type.
 *
 * Shape: { [currentStatus]: { [eventName]: Transition } }
 *
 * Only valid (from, event) pairs are defined — anything not listed
 * is automatically an invalid transition.
 */
export type TransitionMap<
  TStatus extends string,
  TEvent extends string,
  TDoc,
> = Partial<{
  [S in TStatus]: Partial<{
    [E in TEvent]: Transition<TStatus, TDoc>;
  }>;
}>;
